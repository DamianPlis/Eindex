import uFuzzy from "@leeoniya/ufuzzy";

/**
 * uFuzzy instance configured for instant, typo-tolerant, find-as-you-type search.
 */
const uf = new uFuzzy({
  intraMode: 0, // MultiInsert mode: allows abbreviations & forgiving character insertions
  intraIns: Infinity,
});

/**
 * Strips diacritics and accents using uFuzzy.latinize() plus Czech 'ř/Ř'
 * for fast and accurate fuzzy search matching.
 *
 * @param str - The raw input text.
 * @returns Clean normalized string suitable for fast substring and fuzzy matching.
 */
export function normalizeSearchString(str: string): string {
  if (!str) return "";
  return uFuzzy
    .latinize(str.replace(/[řŘ]/g, (c) => (c === "ř" ? "r" : "R")))
    .trim();
}

/**
 * Generates query variations to account for keyboard layout discrepancies
 * such as the QWERTY <-> QWERTZ (Y and Z swapped) issue common in Central Europe.
 *
 * @param query - The user search query.
 * @returns Array of query variations to test against.
 */
function getQueryVariants(query: string): string[] {
  const normalized = normalizeSearchString(query);
  if (!normalized) return [];

  const variants = [normalized];

  // If query contains 'y' or 'z', generate QWERTY <-> QWERTZ swapped variant
  if (/[yz]/i.test(normalized)) {
    const swapped = normalized.replace(/[yzYZ]/g, (c) => {
      switch (c) {
        case "y":
          return "z";
        case "Y":
          return "Z";
        case "z":
          return "y";
        case "Z":
          return "Y";
        default:
          return c;
      }
    });
    if (!variants.includes(swapped)) {
      variants.push(swapped);
    }
  }

  return variants;
}

/**
 * Determines whether a target string matches a search query using uFuzzy,
 * diacritic normalization, and keyboard layout tolerance.
 *
 * @param target - The text to be searched (e.g. subject name or group name).
 * @param query - The search query typed by the user.

 * @returns True if target matches query, false otherwise.
 */
export function matchesLocaleSearch(target: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const normTarget = normalizeSearchString(target);
  const variants = getQueryVariants(query);

  for (const q of variants) {
    // 1. Fast path: normalized substring match (instant O(N))
    if (normTarget.toLowerCase().includes(q.toLowerCase())) {
      return true;
    }

    // 2. uFuzzy fuzzy & multi-insert match
    const idxs = uf.filter([normTarget], q);
    if (idxs && idxs.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Filters and ranks an array of items by search query using uFuzzy.
 *
 * @param items - Array of items to filter.
 * @param getText - Function extracting searchable text from an item.
 * @param query - The user search query.
 * @returns Filtered array of items.
 */
export function filterWithUFuzzy<T>(
  items: T[],
  getText: (item: T) => string,
  query: string,
): T[] {
  if (!query || !query.trim()) return items;
  if (!items.length) return [];

  const rawHaystack = items.map(getText);
  const normHaystack = rawHaystack.map(normalizeSearchString);
  const variants = getQueryVariants(query);

  const matchedIndices = new Set<number>();

  for (const q of variants) {
    const qLower = q.toLowerCase();

    // 1. Fast substring pass
    for (let i = 0; i < normHaystack.length; i++) {
      if (normHaystack[i].toLowerCase().includes(qLower)) {
        matchedIndices.add(i);
      }
    }

    // 2. uFuzzy pass
    const idxs = uf.filter(normHaystack, q);
    if (idxs) {
      for (const idx of idxs) {
        matchedIndices.add(idx);
      }
    }
  }

  return Array.from(matchedIndices).map((idx) => items[idx]);
}
