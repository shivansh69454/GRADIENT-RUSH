import type { ExpenseCategory } from '@/types';
import { detectCategory } from './categories';

export interface VoiceParseResult {
  amount: number | null;
  description: string;
  category: ExpenseCategory;
  confidence: number;
}

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const MULTIPLIERS: Record<string, number> = {
  hundred: 100, thousand: 1000, k: 1000, lakh: 100000, lakhs: 100000, crore: 10000000,
};

/** Converts "two hundred fifty" → 250. Returns null when no words are numeric. */
const wordsToNumber = (words: string[]): number | null => {
  let total = 0;
  let current = 0;
  let matched = false;

  words.forEach((word) => {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (w in WORD_NUMBERS) {
      current += WORD_NUMBERS[w];
      matched = true;
    } else if (w in MULTIPLIERS) {
      const mult = MULTIPLIERS[w];
      if (mult >= 1000) {
        total += (current || 1) * mult;
        current = 0;
      } else {
        current = (current || 1) * mult;
      }
      matched = true;
    }
  });

  if (!matched) return null;
  return total + current;
};

/** Filler words that should never end up in the expense description. */
const FILLERS = new Set([
  'i', 'ive', 'spent', 'spend', 'paid', 'pay', 'add', 'added', 'log', 'logged', 'put',
  'rupees', 'rupee', 'rs', 'inr', 'on', 'for', 'at', 'to', 'the', 'a', 'an', 'of', 'today',
  'yesterday', 'just', 'now', 'some', 'my', 'was', 'were', 'and', 'in', 'expense', 'money',
  'record', 'note', 'about', 'around', 'roughly',
]);

/**
 * Turns a spoken phrase into a draft expense.
 *
 * Handles "spent 150 on lunch", "paid two hundred for uber", "80 rupees chai"
 * and "1.5k on shopping".
 */
export const parseVoiceExpense = (transcript: string): VoiceParseResult => {
  const text = (transcript || '').trim();
  if (!text) return { amount: null, description: '', category: 'Other', confidence: 0 };

  let amount: number | null = null;
  let amountToken = '';

  // 1.5k / 2k
  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    amount = Math.round(Number(kMatch[1]) * 1000);
    amountToken = kMatch[0];
  }

  // Plain digits, optionally with a currency cue.
  if (amount === null) {
    const digitMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i);
    if (digitMatch) {
      const value = Number(digitMatch[1].replace(/,/g, ''));
      if (Number.isFinite(value) && value > 0) {
        amount = value;
        amountToken = digitMatch[0];
      }
    }
  }

  // Spelled-out numbers, which is what the Web Speech API often returns.
  if (amount === null) {
    const words = text.split(/\s+/);
    const numericWindow: string[] = [];
    words.forEach((w) => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      if (clean in WORD_NUMBERS || clean in MULTIPLIERS) numericWindow.push(w);
    });
    const parsed = wordsToNumber(numericWindow);
    if (parsed && parsed > 0) {
      amount = parsed;
      amountToken = numericWindow.join(' ');
    }
  }

  const withoutAmount = amountToken
    ? text.replace(amountToken, ' ')
    : text;

  const description = withoutAmount
    .split(/\s+/)
    .map((w) => w.replace(/[^\w'&-]/g, ''))
    .filter((w) => w.length > 0 && !FILLERS.has(w.toLowerCase()) && !/^\d+$/.test(w))
    .slice(0, 5)
    .join(' ')
    .trim();

  const category = detectCategory(`${description} ${text}`);

  let confidence = 0.2;
  if (amount) confidence += 0.5;
  if (description) confidence += 0.2;
  if (category !== 'Other') confidence += 0.1;

  return {
    amount,
    description: description
      ? description.charAt(0).toUpperCase() + description.slice(1)
      : '',
    category,
    confidence: Math.min(1, confidence),
  };
};

export const VOICE_EXAMPLES = [
  'Spent 150 on lunch',
  'Paid 80 for chai',
  '420 rupees Rapido',
  '1.2k on Myntra shopping',
  'Two hundred fifty on movie tickets',
];
