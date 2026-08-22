import type { ExpenseCategory } from '@/types';
import { detectCategory } from './categories';

export interface ReceiptScan {
  amount: number | null;
  merchant: string | null;
  category: ExpenseCategory;
  candidates: number[];
  rawText: string;
  confidence: number;
}

/** Lines that mention these are the grand total, not a line item. */
const TOTAL_HINTS = [
  'grand total', 'total amount', 'net amount', 'net payable', 'amount payable', 'bill amount',
  'total', 'payable', 'balance due', 'amount due', 'to pay', 'paid',
];

const IGNORE_HINTS = [
  'subtotal', 'sub total', 'tax', 'gst', 'cgst', 'sgst', 'igst', 'vat', 'discount', 'change',
  'cash', 'tender', 'round', 'saving', 'mrp', 'qty', 'rate',
];

const NUMBER_RE = /(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g;

const toNumber = (raw: string): number => Number(raw.replace(/,/g, ''));

/**
 * Extracts a payable amount and merchant from raw OCR text.
 *
 * Receipts are noisy, so this scores candidates rather than trusting the first
 * number it finds: lines labelled as a total win, tax and subtotal lines are
 * penalised, and the largest plausible value breaks ties.
 */
export const parseReceiptText = (rawText: string): ReceiptScan => {
  const text = rawText || '';
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const scored: { value: number; score: number }[] = [];

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    const matches = Array.from(line.matchAll(NUMBER_RE)).map((m) => toNumber(m[1]));
    const plausible = matches.filter((n) => Number.isFinite(n) && n >= 5 && n <= 500000);
    if (plausible.length === 0) return;

    const isTotalLine = TOTAL_HINTS.some((hint) => lower.includes(hint));
    const isIgnored = IGNORE_HINTS.some((hint) => lower.includes(hint));
    const hasRupee = /(?:₹|rs\.?|inr)/i.test(line);
    const hasDecimal = /\.\d{2}\b/.test(line);

    // A total line usually carries the largest number on that line.
    const value = Math.max(...plausible);

    let score = 0;
    if (isTotalLine) score += 6;
    if (isIgnored) score -= 4;
    if (hasRupee) score += 2;
    if (hasDecimal) score += 1;
    if (lower.includes('grand') || lower.includes('net')) score += 2;

    scored.push({ value, score });
  });

  const candidates = Array.from(new Set(scored.map((s) => s.value))).sort((a, b) => b - a);

  const best = scored.sort((a, b) => b.score - a.score || b.value - a.value)[0];
  const amount = best ? best.value : candidates[0] ?? null;

  // The merchant is nearly always in the first couple of lines, in caps.
  const merchant =
    lines
      .slice(0, 5)
      .map((l) => l.replace(/[^A-Za-z&.' ]/g, '').trim())
      .filter((l) => l.length >= 4 && l.split(' ').length <= 5 && /[A-Za-z]{3}/.test(l))
      .sort((a, b) => {
        const aCaps = a === a.toUpperCase() ? 1 : 0;
        const bCaps = b === b.toUpperCase() ? 1 : 0;
        return bCaps - aCaps;
      })[0] ?? null;

  const cleanedMerchant = merchant
    ? merchant
        .toLowerCase()
        .split(' ')
        .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ')
        .trim()
    : null;

  let confidence = 0.15;
  if (amount) confidence += 0.35;
  if (best && best.score >= 6) confidence += 0.25;
  if (cleanedMerchant) confidence += 0.15;
  if (lines.length > 5) confidence += 0.1;

  return {
    amount,
    merchant: cleanedMerchant,
    category: detectCategory(`${cleanedMerchant ?? ''} ${text}`),
    candidates: candidates.slice(0, 6),
    rawText: text,
    confidence: Math.min(1, confidence),
  };
};
