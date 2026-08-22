import type { ExpenseCategory, ParsedToken, ParsedTransaction, TokenKind } from '@/types';
import { detectCategory } from './categories';
import { toDateKey, uid } from './utils';

interface Span {
  start: number;
  end: number;
  kind: TokenKind;
  value: string;
}

/**
 * Ordered highest-priority-first. The first pattern to claim a character range
 * owns it, which stops the merchant matcher from swallowing the amount.
 */
const PATTERNS: { kind: TokenKind; regex: RegExp; group: number }[] = [
  // ₹1,234.56 / Rs. 1234 / INR 500
  { kind: 'amount', regex: /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/gi, group: 1 },
  // 1234.00 debited  (amount before the verb)
  { kind: 'amount', regex: /\b([\d,]+\.\d{2})\b(?=\s*(?:has been\s+)?(?:is\s+)?(?:debited|credited|deducted|spent))/gi, group: 1 },
  // A/c XX1234 · Card ending 4321 · account no. XXXX5678
  { kind: 'account', regex: /\b(?:a\/c|acct?|account|card)\s*(?:no\.?|number|ending|ending with|xx+)?\s*[:\s]?\s*(x*\d{3,6})\b/gi, group: 0 },
  // UPI Ref 123456789012 · Ref no. 998812 · txn id ABC123
  { kind: 'ref', regex: /\b(?:upi\s*)?(?:ref(?:erence)?|txn|transaction)\s*(?:no\.?|id|#)?\s*[:\s]?\s*([a-z0-9]{6,20})\b/gi, group: 0 },
  // 15-08-25 · 15/08/2025 · 15-Aug-25 · on 03 Sep
  { kind: 'date', regex: /\b(\d{1,2}[-/](?:\d{1,2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-/]\d{2,4})\b/gi, group: 1 },
  // to Swiggy · at BLINKIT · to VPA swiggy@ybl · trf to Zomato
  {
    kind: 'merchant',
    regex: /\b(?:to|at|towards|for|trf to|transfer to|vpa|paid to|received from|from)\s+((?:[A-Za-z][A-Za-z&.'-]*(?:@[A-Za-z]+)?)(?:\s+[A-Za-z][A-Za-z&.'-]*){0,3})/g,
    group: 1,
  },
  // Bare UPI handles like harsh@okhdfcbank
  { kind: 'merchant', regex: /\b([a-z0-9._-]{3,}@[a-z]{2,})\b/gi, group: 1 },
];

/** Words that look like merchants to the regex but never are. */
const MERCHANT_STOPWORDS = new Set([
  'your', 'you', 'a', 'an', 'the', 'account', 'acct', 'ac', 'card', 'bank', 'upi', 'ref',
  'reference', 'balance', 'bal', 'avl', 'available', 'info', 'call', 'dispute', 'sms', 'not',
  'if', 'this', 'was', 'is', 'has', 'been', 'txn', 'transaction', 'rs', 'inr', 'and', 'on',
  'debited', 'credited', 'payment', 'purchase', 'more', 'details', 'block', 'help', 'thank',
]);

const CREDIT_WORDS = /\b(credited|received|deposit(?:ed)?|refund(?:ed)?|cashback|salary|added)\b/i;
const DEBIT_WORDS = /\b(debited|spent|paid|withdrawn|deducted|purchase|sent|transferred|charged)\b/i;

const cleanMerchant = (raw: string): string | null => {
  const trimmed = raw
    .replace(/\s+/g, ' ')
    .replace(/[.,;:]+$/, '')
    .trim();
  if (!trimmed) return null;

  const words = trimmed
    .split(' ')
    .filter((w) => !MERCHANT_STOPWORDS.has(w.toLowerCase().replace(/[^a-z@.]/g, '')));
  if (words.length === 0) return null;

  const merchant = words.slice(0, 3).join(' ');
  if (merchant.length < 2) return null;

  // Handle "swiggy@ybl" → "Swiggy"
  const handle = merchant.split('@')[0];
  return handle
    .split(' ')
    .map((w) => (w.length > 3 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase()))
    .join(' ');
};

const parseAmount = (value: string): number => {
  const n = Number(value.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const parseDate = (value: string): string | null => {
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const parts = value.split(/[-/]/);
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const monthRaw = parts[1].toLowerCase();
  const month = /^\d+$/.test(monthRaw) ? Number(monthRaw) - 1 : months[monthRaw.slice(0, 3)];
  let year = Number(parts[2]);
  if (year < 100) year += 2000;

  if (!Number.isFinite(day) || month === undefined || Number.isNaN(month)) return null;
  const parsed = new Date(year, month, day);
  if (Number.isNaN(parsed.getTime()) || parsed > new Date()) return null;
  return toDateKey(parsed);
};

const collectSpans = (text: string): Span[] => {
  const claimed: Span[] = [];

  PATTERNS.forEach(({ kind, regex, group }) => {
    const re = new RegExp(regex.source, regex.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (match[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      const value = match[group] ?? match[0];
      const offsetInMatch = group === 0 ? 0 : match[0].indexOf(value);
      const start = match.index + Math.max(0, offsetInMatch);
      const end = start + value.length;

      const overlaps = claimed.some((s) => start < s.end && end > s.start);
      if (overlaps) continue;

      if (kind === 'merchant' && !cleanMerchant(value)) continue;
      claimed.push({ start, end, kind, value });
    }
  });

  return claimed.sort((a, b) => a.start - b.start);
};

const tokenize = (text: string, spans: Span[]): ParsedToken[] => {
  const tokens: ParsedToken[] = [];
  let cursor = 0;
  spans.forEach((span) => {
    if (span.start > cursor) {
      tokens.push({ text: text.slice(cursor, span.start), kind: 'plain' });
    }
    tokens.push({ text: text.slice(span.start, span.end), kind: span.kind });
    cursor = span.end;
  });
  if (cursor < text.length) tokens.push({ text: text.slice(cursor), kind: 'plain' });
  return tokens;
};

/** Parses one SMS/UPI notification into a highlightable transaction. */
export const parseMessage = (raw: string): ParsedTransaction | null => {
  const text = raw.trim();
  if (text.length < 8) return null;

  const spans = collectSpans(text);

  const amountSpan = spans.find((s) => s.kind === 'amount');
  const merchantSpan = spans.find((s) => s.kind === 'merchant');
  const accountSpan = spans.find((s) => s.kind === 'account');
  const dateSpan = spans.find((s) => s.kind === 'date');

  const amount = amountSpan ? parseAmount(amountSpan.value) : null;
  const merchant = merchantSpan ? cleanMerchant(merchantSpan.value) : null;

  const isCredit = CREDIT_WORDS.test(text) && !DEBIT_WORDS.test(text);
  const direction: 'debit' | 'credit' = isCredit ? 'credit' : 'debit';

  const category: ExpenseCategory = detectCategory(`${merchant ?? ''} ${text}`);
  const date = (dateSpan && parseDate(dateSpan.value)) || toDateKey();

  // Confidence drives the UI badge and whether we pre-select the row.
  let confidence = 0.25;
  if (amount && amount > 0) confidence += 0.4;
  if (merchant) confidence += 0.2;
  if (DEBIT_WORDS.test(text) || CREDIT_WORDS.test(text)) confidence += 0.1;
  if (accountSpan) confidence += 0.05;

  // Append a synthetic category token so the legend can show the inferred label.
  const tokens = tokenize(text, spans);

  return {
    id: uid('txn'),
    raw: text,
    tokens,
    amount: amount && amount > 0 ? amount : null,
    merchant,
    category,
    direction,
    accountHint: accountSpan ? accountSpan.value : null,
    date,
    confidence: Math.min(1, confidence),
  };
};

/**
 * Splits a pasted blob into individual messages. Blank lines are the primary
 * separator; a single blob with several "Rs." mentions is split per line.
 */
export const parseBatch = (input: string): ParsedTransaction[] => {
  const blocks = input
    .split(/\n\s*\n+/)
    .flatMap((block) => {
      const lines = block.split('\n').filter((l) => l.trim().length > 0);
      const amountyLines = lines.filter((l) => /(?:₹|rs\.?|inr)\s*[\d,]/i.test(l));
      // Multiple standalone notifications pasted one per line.
      return amountyLines.length > 1 ? lines : [block];
    })
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks
    .map(parseMessage)
    .filter((t): t is ParsedTransaction => t !== null && t.amount !== null);
};

export const TOKEN_STYLES: Record<TokenKind, { label: string; className: string }> = {
  amount: {
    label: 'Amount',
    className: 'bg-positive/15 text-positive ring-1 ring-inset ring-positive/30 font-semibold',
  },
  merchant: {
    label: 'Merchant',
    className: 'bg-info/15 text-info ring-1 ring-inset ring-info/30 font-medium',
  },
  category: { label: 'Category', className: 'bg-grape/15 text-grape ring-1 ring-inset ring-grape/30' },
  account: {
    label: 'Account',
    className: 'bg-warning/15 text-warning ring-1 ring-inset ring-warning/30',
  },
  date: { label: 'Date', className: 'bg-accent/15 text-accent ring-1 ring-inset ring-accent/30' },
  ref: { label: 'Reference', className: 'bg-muted/15 text-muted ring-1 ring-inset ring-line-strong' },
  plain: { label: 'Text', className: '' },
};

/** Realistic Indian bank/UPI notifications so judges can demo instantly. */
export const SAMPLE_MESSAGES: { bank: string; text: string }[] = [
  {
    bank: 'HDFC Bank',
    text: 'Rs.249.00 debited from a/c XX4471 on 12-08-25 to SWIGGY via UPI Ref 452817channels. Not you? Call 18002586161.',
  },
  {
    bank: 'ICICI Bank',
    text: 'INR 1,250.00 spent on ICICI Bank Card XX8823 at MYNTRA DESIGNS on 11-08-25. Avl Lmt: INR 34,750.00.',
  },
  {
    bank: 'Paytm UPI',
    text: 'Payment of Rs 89 to blinkit@ybl is successful. UPI Ref No 318827461902. Paytm.',
  },
  {
    bank: 'SBI',
    text: 'Dear Customer, Rs.3200.00 debited from A/c XX9012 on 05-08-25 towards RENT PAYMENT. Ref 88213904. -SBI',
  },
  {
    bank: 'Axis Bank',
    text: 'Rs. 60.00 debited from Axis a/c XX1187 to CHAI POINT on 12-08-25. UPI Ref 774102938471.',
  },
  {
    bank: 'Kotak',
    text: 'Sent Rs.420.00 from Kotak a/c XX3345 to rapido@axisbank on 12-08-25. UPI Ref 990183746152.',
  },
  {
    bank: 'HDFC Bank',
    text: 'Rs.15,000.00 credited to a/c XX4471 on 01-08-25 by SALARY CREDIT. Avl bal Rs.18,240.00.',
  },
  {
    bank: 'Amazon Pay',
    text: 'Rs 199 paid to NETFLIX INDIA from Amazon Pay UPI on 08-08-25. Ref 620194837261.',
  },
];
