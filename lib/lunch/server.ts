import "server-only";

import { unstable_cache } from "next/cache";

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDateToISO(label: string): string | null {
  const m = label.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  const year = m[3];
  return `${year}-${month}-${day}`;
}

function extractPerDay(html: string): Record<string, string> {
  const perDay: Record<string, string> = {};
  const dayBlocks = html.split(/<div[^>]*class="[^"]*den[^"]*container-fluid[^"]*"[^>]*>/i).slice(1);

  for (const block of dayBlocks) {
    const dateMatch = block.match(/<[^>]*class="[^"]*datum[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i);
    if (!dateMatch) continue;
    const dateISO = parseDateToISO(decodeHtml(dateMatch[1]));
    if (!dateISO) continue;

    const schoolBlocks = block
      .split(/<div[^>]*class="[^"]*castDne[^"]*"[^>]*>/i)
      .slice(1)
      .map((x) => x.trim());

    const chosen =
      schoolBlocks.find((s) => /Radlick/i.test(s)) ||
      schoolBlocks.find((s) => /hlavicka/i.test(s)) ||
      "";

    const itemBlocks = [
      ...chosen.matchAll(/<div[^>]*class="[^"]*menuJidla[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi),
    ];

    let mainCourse = "";
    for (const item of itemBlocks) {
      const chunk = item[1];
      const typeMatch = chunk.match(/<[^>]*class="[^"]*popiskaJidla[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i);
      const textMatch = chunk.match(/<[^>]*class="[^"]*textJidla[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i);
      const type = decodeHtml(typeMatch?.[1] || "");
      const text = decodeHtml(textMatch?.[1] || "");
      if (!text) continue;
      if (/jidlo|obed|hlavni/i.test(type) && !/polevka|soup/i.test(type)) {
        mainCourse = text;
        break;
      }
      if (!mainCourse) mainCourse = text;
    }

    perDay[dateISO] = mainCourse || "Menu unavailable";
  }

  return perDay;
}

const fetchMenuHtml = unstable_cache(
  async () => {
    const jidelnaId = "2069";
    const targetUrl = `https://www.jidelna.cz/jidelni-listek/?jidelna=${encodeURIComponent(jidelnaId)}`;
    const response = await fetch(targetUrl, {
      next: { revalidate: 60 * 60 * 12 },
      headers: {
        "user-agent": "Mozilla/5.0",
      },
    });
    if (!response.ok) {
      throw new Error(`Lunch upstream failed with ${response.status}`);
    }
    return response.text();
  },
  ["eindx-lunch-html"],
  { revalidate: 60 * 60 * 12 },
);

export async function getLunchPerDay(): Promise<Record<string, string>> {
  try {
    const html = await fetchMenuHtml();
    return extractPerDay(html);
  } catch {
    return {};
  }
}
