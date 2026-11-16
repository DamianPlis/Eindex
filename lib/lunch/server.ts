import "server-only";

import { load } from "cheerio";
import { unstable_cache } from "next/cache";

/**
 * Normalizes text by converting non-breaking spaces to spaces, consolidating
 * multiple consecutive spaces, and trimming whitespace.
 *
 * @param text - The raw text string.
 * @returns The normalized string.
 */
function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Removes diacritics (accents) from a given string.
 *
 * @param text - The text string to strip.
 * @returns The stripped string.
 */
function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Parses a date string in format "DD. MM. YYYY" to an ISO-8601 string (YYYY-MM-DD).
 *
 * @param label - The raw date label string.
 * @returns The ISO date string or null if not matchable.
 */
function parseDateToISO(label: string): string | null {
  const m = label.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  const year = m[3];
  return `${year}-${month}-${day}`;
}

/**
 * Checks if the given label denotes a soup.
 *
 * @param label - The food label.
 * @returns True if it refers to soup, false otherwise.
 */
function isSoupLabel(label: string): boolean {
  const normalized = stripDiacritics(label).toLowerCase();
  return normalized.includes("polevka") || normalized.includes("soup");
}

/**
 * Checks if the given label denotes a main course/dish.
 *
 * @param label - The food label.
 * @returns True if it refers to a main course, false otherwise.
 */
function isMainCourseLabel(label: string): boolean {
  const normalized = stripDiacritics(label).toLowerCase();
  return (
    normalized.includes("jidlo") ||
    normalized.includes("obed") ||
    normalized.includes("hlavni") ||
    normalized.includes("main")
  );
}

/**
 * Finds the index of the first comma in the text that is not enclosed inside brackets [].
 *
 * @param text - The text to search.
 * @returns The index of the comma, or -1 if not found.
 */
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

/**
 * Cleans the meal text by removing the soup label if it is prefixed before a comma.
 *
 * @param text - The raw meal text.
 * @returns The cleaned meal text.
 */
function removeLeadingSoup(text: string): string {
  const cleaned = normalizeText(text);
  const commaIndex = findCommaOutsideBrackets(cleaned);
  if (commaIndex === -1) return cleaned;

  const firstPart = cleaned.slice(0, commaIndex);
  if (!isSoupLabel(firstPart)) return cleaned;

  return cleaned
    .slice(commaIndex + 1)
    .replace(/^[,;.\s-]+/, "")
    .trim();
}

/**
 * Picks the most appropriate meal from a list of items, prioritizing main courses.
 *
 * @param items - List of item objects containing type and text.
 * @param includeSoup - Whether to keep soup in the daily menu.
 * @returns The picked meal name, optionally with soup.
 */
function pickMeal(
  items: Array<{ type: string; text: string }>,
  includeSoup: boolean,
): string {
  const mainCourse = items.find(
    (item) => isMainCourseLabel(item.type) && !isSoupLabel(item.type),
  );
  const meal = mainCourse ?? items.find((item) => !isSoupLabel(item.type));
  if (!includeSoup)
    return removeLeadingSoup(meal?.text ?? items[0]?.text ?? "");

  const soup = items.find((item) => isSoupLabel(item.type));
  if (!soup) return meal?.text ?? "";
  const main = removeLeadingSoup(meal?.text ?? "");
  return main ? `${soup.text}, ${main}` : soup.text;
}

/**
 * Extracts lunch menu details per day from raw HTML content.
 *
 * @param html - The HTML response content from the lunch provider.
 * @param date - If provided, only extract this day's lunch, including soup.
 * @returns A mapping of ISO date strings to meal descriptions.
 */
function extractPerDay(html: string, date?: string): Record<string, string> {
  const perDay: Record<string, string> = {};
  const $ = load(html);

  $(".den.container-fluid").each((_, dayEl) => {
    const dateLabel = normalizeText($(dayEl).find(".datum").first().text());
    const dateISO = parseDateToISO(dateLabel);
    if (!dateISO || (date && dateISO !== date)) return;

    const partNodes = $(dayEl).find(".castDne").toArray();
    const chosenPart =
      partNodes.find((partEl) => {
        const headerText = normalizeText(
          $(partEl).find(".hlavicka").first().text(),
        );
        return stripDiacritics(headerText).toLowerCase().includes("bitovsk");
      }) || partNodes[0];

    if (!chosenPart) {
      perDay[dateISO] = "Menu unavailable";
      return;
    }

    const items: Array<{ type: string; text: string }> = [];
    $(chosenPart)
      .find(".menuJidla")
      .each((_, menuEl) => {
        $(menuEl)
          .find(".row")
          .each((_, itemEl) => {
            const type = normalizeText(
              $(itemEl).find(".popiskaJidla").first().text(),
            );
            const text = normalizeText(
              $(itemEl).find(".textJidla").first().text(),
            );
            if (!text) return;
            items.push({ type, text });
          });
      });

    const pickedMeal = pickMeal(items, date !== undefined);
    perDay[dateISO] = pickedMeal || "Menu unavailable";
  });

  return perDay;
}

const fetchMenuHtml = unstable_cache(
  async (date?: string) => {
    const targetUrl = new URL(
      "https://www.jidelna.cz/jidelni-listek/?jidelna=2069",
    );
    if (date) {
      targetUrl.searchParams.set("zacatek", date);
      targetUrl.searchParams.set("delka", "P1D");
    }
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

/**
 * Fetches the raw HTML menu from the jidelna.cz provider and parses it
 * to return a mapping of daily ISO date keys to meal name strings.
 *
 * @param date - If provided, only return this day's lunch, including soup.
 * @returns A promise resolving to the menu mapping object.
 */
export async function getLunchPerDay(
  date?: string,
): Promise<Record<string, string>> {
  try {
    const html = await fetchMenuHtml(date);
    return extractPerDay(html, date);
  } catch (err) {
    console.error("[lunch] getLunchPerDay failed:", err);
    return {};
  }
}
