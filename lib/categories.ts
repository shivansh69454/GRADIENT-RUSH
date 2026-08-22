import type { ExpenseCategory } from '@/types';

export interface CategoryMeta {
  key: ExpenseCategory;
  emoji: string;
  /** Tailwind-safe token name from our palette. */
  color: string;
  /** Share of a student budget that is considered healthy. */
  healthyShare: number;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'Food', emoji: '🍜', color: 'rgb(var(--warning))', healthyShare: 0.3 },
  { key: 'Transport', emoji: '🛺', color: 'rgb(var(--info))', healthyShare: 0.12 },
  { key: 'Groceries', emoji: '🛒', color: 'rgb(var(--positive))', healthyShare: 0.18 },
  { key: 'Shopping', emoji: '🛍️', color: 'rgb(var(--grape))', healthyShare: 0.1 },
  { key: 'Entertainment', emoji: '🎬', color: 'rgb(var(--negative))', healthyShare: 0.08 },
  { key: 'Bills', emoji: '🧾', color: 'rgb(var(--accent))', healthyShare: 0.1 },
  { key: 'Rent', emoji: '🏠', color: '#7c8290', healthyShare: 0.25 },
  { key: 'Education', emoji: '📚', color: '#3aa8a0', healthyShare: 0.12 },
  { key: 'Health', emoji: '💊', color: '#d9538a', healthyShare: 0.06 },
  { key: 'Other', emoji: '📦', color: '#8a8f98', healthyShare: 0.06 },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export const getCategoryMeta = (category: string): CategoryMeta =>
  CATEGORIES.find((c) => c.key.toLowerCase() === category?.toLowerCase()) ??
  CATEGORIES[CATEGORIES.length - 1];

/**
 * Keyword → category map used by the manual form, the voice parser and the SMS
 * parser so all three classify "swiggy" identically.
 */
const KEYWORDS: Record<ExpenseCategory, string[]> = {
  Food: [
    'swiggy', 'zomato', 'dominos', 'domino', 'mcdonald', 'kfc', 'burger', 'pizza', 'cafe',
    'coffee', 'starbucks', 'chai', 'tea', 'restaurant', 'dhaba', 'canteen', 'mess', 'lunch',
    'dinner', 'breakfast', 'snack', 'samosa', 'biryani', 'maggi', 'juice', '食', 'eat', 'food',
    'hotel', 'bakery', 'icecream', 'ice cream', 'momos', 'roll', 'thali', 'eatsure', 'faasos',
  ],
  Transport: [
    'uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'irctc', 'petrol', 'diesel', 'fuel',
    'auto', 'cab', 'taxi', 'toll', 'parking', 'redbus', 'indigo', 'flight', 'yulu', 'bounce',
  ],
  Groceries: [
    'blinkit', 'zepto', 'bigbasket', 'dmart', 'grofers', 'instamart', 'jiomart', 'grocery',
    'groceries', 'vegetables', 'sabzi', 'milk', 'kirana', 'supermarket', 'reliance fresh',
  ],
  Shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'shopping', 'clothes', 'shoes',
    'tshirt', 'jeans', 'shirt', 'decathlon', 'zara', 'hm', 'lifestyle', 'shopclues', 'snapdeal',
  ],
  Entertainment: [
    'netflix', 'spotify', 'hotstar', 'prime', 'jiocinema', 'sonyliv', 'zee5', 'bookmyshow',
    'pvr', 'inox', 'cinema', 'movie', 'game', 'steam', 'playstation', 'concert', 'party',
    'youtube premium', 'club', 'bar', 'pub',
  ],
  Bills: [
    'airtel', 'jio', 'vodafone', 'vi ', 'bsnl', 'recharge', 'electricity', 'water bill',
    'gas', 'broadband', 'wifi', 'dth', 'tata power', 'adani', 'bescom', 'bill', 'postpaid',
    'prepaid', 'insurance', 'premium',
  ],
  Rent: ['rent', 'hostel', 'pg ', 'landlord', 'deposit', 'maintenance', 'society'],
  Education: [
    'course', 'udemy', 'coursera', 'unacademy', 'byju', 'vedantu', 'book', 'stationery',
    'tuition', 'coaching', 'exam', 'fee', 'fees', 'college', 'university', 'library', 'xerox',
    'printout', 'notebook',
  ],
  Health: [
    'pharmeasy', 'apollo', 'medplus', 'netmeds', '1mg', 'hospital', 'clinic', 'doctor',
    'medicine', 'medical', 'gym', 'cult', 'fitness', 'dentist', 'lab', 'test',
  ],
  Other: [],
};

/** Best-effort category from free text. Falls back to `Other`. */
export const detectCategory = (text: string): ExpenseCategory => {
  const haystack = (text || '').toLowerCase();
  if (!haystack.trim()) return 'Other';

  let best: { category: ExpenseCategory; score: number } = { category: 'Other', score: 0 };
  (Object.keys(KEYWORDS) as ExpenseCategory[]).forEach((category) => {
    KEYWORDS[category].forEach((word) => {
      if (haystack.includes(word)) {
        // Longer keyword matches are more specific, so they win ties.
        const score = word.length;
        if (score > best.score) best = { category, score };
      }
    });
  });
  return best.category;
};

/** Emoji shown next to an expense row — merchant-specific where we know it. */
const MERCHANT_EMOJI: [string, string][] = [
  ['swiggy', '🛵'], ['zomato', '🍽️'], ['starbucks', '☕'], ['coffee', '☕'], ['chai', '🫖'],
  ['pizza', '🍕'], ['burger', '🍔'], ['biryani', '🍛'], ['uber', '🚗'], ['ola', '🚕'],
  ['rapido', '🏍️'], ['metro', '🚇'], ['petrol', '⛽'], ['fuel', '⛽'], ['amazon', '📦'],
  ['flipkart', '🛒'], ['myntra', '👕'], ['netflix', '🎬'], ['spotify', '🎧'], ['gym', '🏋️'],
  ['medicine', '💊'], ['book', '📖'], ['recharge', '📱'], ['electricity', '💡'], ['rent', '🏠'],
  ['blinkit', '⚡'], ['zepto', '🛒'], ['movie', '🎟️'], ['game', '🎮'], ['haircut', '💈'],
];

export const detectEmoji = (text: string, category?: string): string => {
  const haystack = (text || '').toLowerCase();
  const hit = MERCHANT_EMOJI.find(([word]) => haystack.includes(word));
  if (hit) return hit[1];
  return getCategoryMeta(category ?? detectCategory(haystack)).emoji;
};
