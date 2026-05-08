import "server-only";

import { load } from "cheerio";
import { unstable_cache } from "next/cache";

function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parseDateToISO(label: string): string | null {
  const m = label.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  const year = m[3];
  return `${year}-${month}-${day}`;
}

function isSoupLabel(label: string): boolean {
  const normalized = stripDiacritics(label).toLowerCase();
  return normalized.includes("polevka") || normalized.includes("soup");
}

function isMainCourseLabel(label: string): boolean {
  const normalized = stripDiacritics(label).toLowerCase();
  return (
    normalized.includes("jidlo") ||
    normalized.includes("obed") ||
    normalized.includes("hlavni") ||
    normalized.includes("main")
  );
}

function findCommaOutsideBrackets(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "[") depth += 1;
    else if (ch === "]" && depth > 0) depth -= 1;
    else if (ch === "," && depth === 0) return i;
  }
  return -1;
}

function removeLeadingSoup(text: string): string {
  const cleaned = normalizeText(text);
  const commaIndex = findCommaOutsideBrackets(cleaned);
  if (commaIndex === -1) return cleaned;

  const firstPart = cleaned.slice(0, commaIndex);
  if (!isSoupLabel(firstPart)) return cleaned;

  return cleaned.slice(commaIndex + 1).replace(/^[,;.\s-]+/, "").trim();
}

function pickMeal(items: Array<{ type: string; text: string }>): string {
  const mainCourse = items.find((item) => isMainCourseLabel(item.type) && !isSoupLabel(item.type));
  if (mainCourse) return removeLeadingSoup(mainCourse.text);

  const nonSoup = items.find((item) => !isSoupLabel(item.type));
  if (nonSoup) return removeLeadingSoup(nonSoup.text);

  return removeLeadingSoup(items[0]?.text || "");
}

function extractPerDay(html: string): Record<string, string> {
  const perDay: Record<string, string> = {};
  const $ = load(html);

  $(".den.container-fluid").each((_, dayEl) => {
    const dateLabel = normalizeText($(dayEl).find(".datum").first().text());
    const dateISO = parseDateToISO(dateLabel);
    if (!dateISO) return;

    const partNodes = $(dayEl).find(".castDne").toArray();
    const chosenPart =
      partNodes.find((partEl) => {
        const headerText = normalizeText($(partEl).find(".hlavicka").first().text());
        return stripDiacritics(headerText).toLowerCase().includes("radlick");
      }) || partNodes[0];

    if (!chosenPart) {
      perDay[dateISO] = "Menu unavailable";
      return;
    }

    const items: Array<{ type: string; text: string }> = [];
    $(chosenPart)
      .find(".menuJidla")
      .each((_, menuEl) => {
        $(menuEl).find(".row")
        .each((_, itemEl) => {
          const type = normalizeText($(itemEl).find(".popiskaJidla").first().text());
          const text = normalizeText($(itemEl).find(".textJidla").first().text());
          if (!text) return;
          items.push({ type, text });
        });
      });

    const pickedMeal = pickMeal(items);
    perDay[dateISO] = pickedMeal || "Menu unavailable";
  });

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
  } catch (err) {
    console.error("[lunch] getLunchPerDay failed:", err);
    return {};
  }
}
