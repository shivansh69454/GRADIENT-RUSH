/**
 * Matching logic for the command palette.
 *
 * Kept separate from the component so the ranking is testable and so the
 * "is this an expense or a command?" decision lives in one place.
 */

/**
 * Subsequence fuzzy match with a bonus for consecutive hits and word starts,
 * which is what makes "sph" find "Spending heatmap" ahead of "Split".
 * Returns null when the query is not a subsequence of the target at all.
 */
export const fuzzyScore = (query: string, target: string): number | null => {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (q.length === 0) return 0;
  if (q.length > t.length) return null;

  let score = 0;
  let ti = 0;
  let streak = 0;

  for (let qi = 0; qi < q.length; qi += 1) {
    const char = q[qi];
    if (char === ' ') continue;

    const found = t.indexOf(char, ti);
    if (found === -1) return null;

    // Matching the first letter of a word is a strong signal of intent.
    const atWordStart = found === 0 || /[\s\-/]/.test(t[found - 1]);
    score += atWordStart ? 12 : 4;
    score += streak > 0 ? streak * 3 : 0;
    // Later matches are weaker, so earlier targets win ties.
    score -= Math.min(found - ti, 6);

    streak = found === ti ? streak + 1 : 1;
    ti = found + 1;
  }

  // Shorter targets that contain the query are usually the better answer.
  return score + Math.max(0, 20 - t.length / 2);
};

/** Prefixes that force the palette into a specific mode. */
export const ASK_PREFIXES = ['ask ', '? ', '?'];

export const stripAskPrefix = (input: string): string | null => {
  const trimmed = input.trimStart();
  const hit = ASK_PREFIXES.find((p) => trimmed.toLowerCase().startsWith(p));
  if (!hit) return null;
  const rest = trimmed.slice(hit.length).trim();
  return rest.length > 0 ? rest : '';
};

/**
 * Whether free text looks like an expense worth offering to log.
 *
 * Deliberately strict: it needs a number, and that number must not be the whole
 * input, otherwise typing "5" while hunting for a page offers to log ₹5.
 */
export const looksLikeExpense = (input: string): boolean => {
  const text = input.trim();
  if (text.length < 3) return false;
  if (!/\d/.test(text)) return false;
  // Bare numbers are ambiguous; require some describing text alongside.
  return /[a-z]{2,}/i.test(text);
};
