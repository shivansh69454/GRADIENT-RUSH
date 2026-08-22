import type { ExpenseCategory, StatementRow } from '@/types';
import { detectCategory } from './categories';
import { toDateKey, uid } from './utils';

/**
 * Reads a whole payment-history screenshot into many expenses at once.
 *
 * The SMS parser handles one notification at a time, which is fine for alerts
 * but hopeless for the way people actually check their money: opening GPay or
 * PhonePe and scrolling. OCR of that screen produces a loose, two-dimensional
 * list — merchant on one line, amount on the next, a date header floating above
 * a run of rows — so this reassembles rows from that vertical structure rather
 * than expecting one self-contained sentence per line.
 */

/** ₹249 · Rs. 1,250.00 · -₹89 — an explicit currency marker. */
const CURRENCY_AMOUNT_RE = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i;
/** Bare "249.00", which is how many screenshots render the column. */
const DECIMAL_AMOUNT_RE = /\b([\d,]{2,}\.\d{2})\b/;

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const CREDIT_RE = /\b(received|refund(?:ed)?|credited|cashback|added|from)\b/i;
const DEBIT_RE = /\b(paid|sent|debited|spent|to|purchase)\b/i;

/** Chrome from the app UI that OCR happily reads as a merchant name. */
const CHROME = new Set([
  'all', 'transactions', 'transaction', 'history', 'balance', 'search', 'filter', 'today',
  'yesterday', 'this', 'month', 'week', 'view', 'details', 'detail', 'show', 'more', 'less',
  'completed', 'success', 'successful', 'failed', 'pending', 'payment', 'payments', 'upi',
  'bank', 'account', 'wallet', 'cashback', 'offers', 'home', 'profile', 'help', 'total',
  'spent', 'received', 'paid', 'sent', 'debited', 'credited', 'available', 'avl', 'limit',
  'statement', 'summary', 'recent', 'activity', 'you', 'your', 'and', 'the', 'for', 'via',
]);

const parseAmount = (line: string): number | null => {
  const match = line.match(CURRENCY_AMOUNT_RE) ?? line.match(DECIMAL_AMOUNT_RE);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(/,/g, ''));
  // Anything above a lakh on a student's history is almost certainly a balance
  // or an account number that OCR mangled into a number.
  if (!Number.isFinite(value) || value <= 0 || value > 100000) return null;
  return value;
};

/**
 * Dates in screenshots come as standalone headers: "12 Aug", "Aug 12, 2025",
 * "Today", "Yesterday", or "12/08/25". Returns null for a non-date line.
 */
const parseDateLine = (line: string): string | null => {
  const text = line.trim().toLowerCase();
  if (text.length > 24) return null;

  if (/^today\b/.test(text)) return toDateKey();
  if (/^yesterday\b/.test(text)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateKey(d);
  }

  const now = new Date();

  // 12 Aug 2025 / 12 Aug / Aug 12
  const named =
    text.match(/^(\d{1,2})\s+([a-z]{3,})\.?,?\s*(\d{2,4})?$/) ??
    text.match(/^([a-z]{3,})\.?\s+(\d{1,2}),?\s*(\d{2,4})?$/);
  if (named) {
    const isDayFirst = /^\d/.test(named[1]);
    const day = Number(isDayFirst ? named[1] : named[2]);
    const monthKey = (isDayFirst ? named[2] : named[1]).slice(0, 3);
    const month = MONTHS[monthKey];
    if (month === undefined || !Number.isFinite(day) || day < 1 || day > 31) return null;
    let year = named[3] ? Number(named[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const parsed = new Date(year, month, day);
    // A "future" date on a history screen means it belongs to last year.
    if (parsed > now && !named[3]) parsed.setFullYear(year - 1);
    return parsed > now ? null : toDateKey(parsed);
  }

  // 12/08/25 or 12-08-2025
  const numeric = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    let year = Number(numeric[3]);
    if (year < 100) year += 2000;
    const parsed = new Date(year, month, day);
    if (Number.isNaN(parsed.getTime()) || parsed > now) return null;
    return toDateKey(parsed);
  }

  return null;
};

/** Strips amounts, times, status words and punctuation to leave a name. */
const cleanMerchant = (line: string): string => {
  const stripped = line
    .replace(CURRENCY_AMOUNT_RE, ' ')
    .replace(DECIMAL_AMOUNT_RE, ' ')
    .replace(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi, ' ')
    .replace(/\b(?:paid to|sent to|received from|debited from|credited to|payment to)\b/gi, ' ')
    .replace(/[₹|•·—–\-–_>*#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = stripped
    .split(' ')
    .filter((w) => {
      const bare = w.toLowerCase().replace(/[^a-z@.&']/g, '');
      if (bare.length < 2) return false;
      return !CHROME.has(bare);
    })
    .slice(0, 4);

  const merchant = words.join(' ').split('@')[0].trim();
  if (merchant.length < 2) return '';

  return merchant
    .split(' ')
    .map((w) => (w.length > 3 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase()))
    .join(' ');
};

/** True when a line carries no useful signal at all. */
const isNoise = (line: string): boolean => {
  const text = line.trim();
  if (text.length < 2) return true;
  // Lines that are only punctuation or single characters from OCR artefacts.
  return !/[a-z0-9]/i.test(text);
};

/**
 * Lines that contain a big number which is emphatically not a transaction.
 * Without this, "Available balance ₹8,240.00" becomes an ₹8,240 expense
 * attributed to whatever merchant happened to be listed above it.
 */
const NOT_A_TRANSACTION =
  /\b(?:avl|available|closing|opening|current|remaining)?\s*(?:bal(?:ance)?|limit|due|outstanding|total\s+spent|month(?:ly)?\s+total)\b/i;

export const parseStatementText = (rawText: string): StatementRow[] => {
  const lines = (rawText || '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => !isNoise(l));

  const rows: StatementRow[] = [];
  // Date headers apply to every row beneath them until the next header.
  let activeDate = toDateKey();

  lines.forEach((line, index) => {
    const asDate = parseDateLine(line);
    if (asDate) {
      activeDate = asDate;
      return;
    }

    if (NOT_A_TRANSACTION.test(line)) return;

    const amount = parseAmount(line);
    if (amount === null) return;

    // Prefer a name on the same line; fall back to the nearest line above,
    // which is where GPay and PhonePe put it.
    let merchant = cleanMerchant(line);
    let raw = line;

    if (!merchant) {
      for (let back = 1; back <= 2 && index - back >= 0; back += 1) {
        const previous = lines[index - back];
        if (parseDateLine(previous) || parseAmount(previous) !== null) continue;
        const candidate = cleanMerchant(previous);
        if (candidate) {
          merchant = candidate;
          raw = `${previous} · ${line}`;
          break;
        }
      }
    }

    // Direction has to be read from the reassembled row: "Received from Mom" and
    // the amount it refers to almost always sit on separate lines.
    const isCredit = CREDIT_RE.test(raw) && !DEBIT_RE.test(raw);
    const category: ExpenseCategory = detectCategory(`${merchant} ${raw}`);

    let confidence = 0.4;
    if (merchant) confidence += 0.25;
    if (category !== 'Other') confidence += 0.15;
    if (asDate !== null || activeDate !== toDateKey()) confidence += 0.1;
    if (DEBIT_RE.test(raw) || CREDIT_RE.test(raw)) confidence += 0.1;

    rows.push({
      id: uid('row'),
      merchant: merchant || 'Unknown merchant',
      amount,
      date: activeDate,
      category,
      direction: isCredit ? 'credit' : 'debit',
      confidence: Math.min(1, confidence),
      raw,
    });
  });

  return dedupe(rows);
};

/**
 * OCR often reads the same row twice when a screenshot has overlapping text
 * layers. Identical merchant + amount + date within one pass is a duplicate.
 */
const dedupe = (rows: StatementRow[]): StatementRow[] => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.merchant.toLowerCase()}|${row.amount}|${row.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export interface StatementStats {
  debits: number;
  credits: number;
  debitTotal: number;
}

export const statementStats = (rows: StatementRow[]): StatementStats => ({
  debits: rows.filter((r) => r.direction === 'debit').length,
  credits: rows.filter((r) => r.direction === 'credit').length,
  debitTotal: rows
    .filter((r) => r.direction === 'debit')
    .reduce((acc, r) => acc + r.amount, 0),
});
