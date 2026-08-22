import type { DailyExpense, Subscription, SubscriptionCadence } from '@/types';
import { detectCategory, detectEmoji } from './categories';
import { addDays, daysBetween, toDateKey } from './utils';

/**
 * Finds the recurring charges hiding in a plain expense list.
 *
 * Nobody remembers what they are subscribed to, and no bank statement labels it.
 * So instead of asking, this mines the ledger the user already has: charges from
 * the same merchant, for near-identical amounts, arriving on a regular cadence.
 * Two occurrences is enough to raise a suspicion; more tightens confidence.
 */

/** Cadence windows in days, ordered so the tightest match wins. */
const CADENCES: { cadence: SubscriptionCadence; min: number; max: number; perMonth: number }[] = [
  { cadence: 'weekly', min: 6, max: 8, perMonth: 30 / 7 },
  { cadence: 'monthly', min: 25, max: 36, perMonth: 1 },
  { cadence: 'quarterly', min: 84, max: 96, perMonth: 1 / 3 },
];

/**
 * Collapses a description to a merchant identity: lowercase, no order numbers,
 * no trailing refs. "Netflix #4471" and "netflix" become the same subscription.
 */
const merchantKey = (description: string): string =>
  (description || '')
    .toLowerCase()
    .replace(/[#*]/g, ' ')
    .replace(/\b(?:ref|txn|order|inv|id)\b.*/i, ' ')
    .replace(/\d+/g, ' ')
    .replace(/[^a-z\s&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Title-cases the mined key back into something presentable. */
const prettyMerchant = (key: string, fallback: string): string => {
  const source = key || fallback;
  return source
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

/**
 * The minimum number of charges before a pattern counts.
 *
 * Three charges means two gaps, which is the least evidence that can establish
 * a rhythm rather than a coincidence. Two would flag every pair of Swiggy orders
 * that happened to land a week apart, and a radar full of false positives is
 * worse than no radar.
 */
const MIN_OCCURRENCES = 3;

/** How far an individual charge may drift from the series and still belong. */
const AMOUNT_TOLERANCE = 0.08;

/**
 * Slack on the "does this merchant charge you at subscription frequency?" test.
 *
 * This gate is what separates a subscription from a habit, and it is doing more
 * work than the cadence check. Any merchant you use often will, by pure chance,
 * contain some subsequence of charges spaced a month apart at a similar price —
 * over four months of daily chai there are thousands of such subsequences. The
 * distinguishing fact is not that a monthly-spaced chain exists, it is that the
 * chain is *all* the merchant ever charged you. Netflix bills four times in four
 * months; a canteen bills forty.
 */
const FREQUENCY_SLACK = 1.4;

/**
 * Share of a merchant's charges the series must account for.
 *
 * A subscription is the *only* reason that merchant appears in your ledger. If
 * three monthly-spaced charges are all that match out of twenty Swiggy orders,
 * the pattern is an artefact of having lots of orders to choose from.
 */
const MIN_COVERAGE = 0.6;

/**
 * Calendar alignment: real subscriptions bill on the same date every month, or
 * the same weekday every week. Random purchases that happen to fall a month
 * apart drift across the calendar, and with only three or four charges to judge
 * by this separates them far more reliably than cadence or price ever could.
 */
const MAX_DAY_DRIFT = 2;

/** Distance between two days of the month, wrapping across the month boundary. */
const dayOfMonthDistance = (a: number, b: number): number => {
  const direct = Math.abs(a - b);
  return Math.min(direct, 31 - direct);
};

const isCalendarAligned = (dates: string[], cadence: SubscriptionCadence): boolean => {
  if (cadence === 'weekly') {
    const weekdays = dates.map((d) => new Date(d).getDay());
    const first = weekdays[0];
    return weekdays.every((day) => Math.min(Math.abs(day - first), 7 - Math.abs(day - first)) <= 1);
  }

  const daysOfMonth = dates.map((d) => Number(d.slice(8, 10)));
  const reference = daysOfMonth[0];
  return daysOfMonth.every((day) => dayOfMonthDistance(day, reference) <= MAX_DAY_DRIFT);
};

interface Series {
  key: string;
  label: string;
  items: DailyExpense[];
  cadence: SubscriptionCadence;
  perMonth: number;
}

const gapFits = (gap: number, cadence: SubscriptionCadence): boolean => {
  const spec = CADENCES.find((c) => c.cadence === cadence);
  return spec ? gap >= spec.min && gap <= spec.max : false;
};

const cadenceForGap = (gap: number) => CADENCES.find((c) => gap >= c.min && gap <= c.max);

/**
 * Walks one merchant's charges in date order and grows runs that keep the same
 * amount on the same cadence. Requiring *every* gap to fit — not just the median
 * — is what separates a real subscription from a merchant you happen to use
 * often.
 */
const buildSeries = (key: string, items: DailyExpense[]): Series[] => {
  const chronological = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const open: Series[] = [];
  const closed: Series[] = [];

  chronological.forEach((item) => {
    const amount = Number(item.amount) || 0;

    const target = open.find((series) => {
      const reference = median(series.items.map((e) => e.amount));
      const withinAmount =
        Math.abs(amount - reference) <= Math.max(reference * AMOUNT_TOLERANCE, 2);
      if (!withinAmount) return false;

      const gap = Math.abs(daysBetween(series.items[series.items.length - 1].date, item.date));
      return gapFits(gap, series.cadence);
    });

    if (target) {
      target.items.push(item);
      return;
    }

    // Try to seed a new series against any charge not yet in one.
    const seed = open.find((series) => {
      if (series.items.length > 1) return false;
      const reference = series.items[0].amount;
      const withinAmount =
        Math.abs(amount - reference) <= Math.max(reference * AMOUNT_TOLERANCE, 2);
      if (!withinAmount) return false;
      return Boolean(cadenceForGap(Math.abs(daysBetween(series.items[0].date, item.date))));
    });

    if (seed) {
      const gap = Math.abs(daysBetween(seed.items[0].date, item.date));
      const spec = cadenceForGap(gap);
      if (spec) {
        seed.cadence = spec.cadence;
        seed.perMonth = spec.perMonth;
        seed.items.push(item);
        return;
      }
    }

    open.push({
      key,
      label: item.description || key,
      items: [item],
      // Provisional until a second charge reveals the real rhythm.
      cadence: 'monthly',
      perMonth: 1,
    });
  });

  closed.push(...open);
  return closed;
};

/**
 * A quiet price rise splits a subscription in two: three charges at ₹199, then
 * one at ₹249. Stitching those back together is the only way the increase is
 * visible at all — which is exactly the thing worth showing.
 */
const mergePriceChanges = (series: Series[]): Series[] => {
  const sorted = [...series].sort((a, b) => a.items[0].date.localeCompare(b.items[0].date));
  const merged: Series[] = [];

  sorted.forEach((candidate) => {
    const predecessor = merged.find((existing) => {
      if (existing.key !== candidate.key) return false;
      const lastOfExisting = existing.items[existing.items.length - 1].date;
      const firstOfCandidate = candidate.items[0].date;
      if (firstOfCandidate <= lastOfExisting) return false;
      const gap = Math.abs(daysBetween(lastOfExisting, firstOfCandidate));
      return gapFits(gap, existing.cadence);
    });

    if (predecessor) predecessor.items.push(...candidate.items);
    else merged.push(candidate);
  });

  return merged;
};

export const detectSubscriptions = (expenses: DailyExpense[]): Subscription[] => {
  const byMerchant = new Map<string, DailyExpense[]>();

  expenses.forEach((expense) => {
    const key = merchantKey(expense.description);
    // Single-word noise like "x" or a blank description cannot be a merchant.
    if (key.length < 3) return;
    const bucket = byMerchant.get(key) ?? [];
    bucket.push(expense);
    byMerchant.set(key, bucket);
  });

  const subscriptions: Subscription[] = [];

  byMerchant.forEach((items, key) => {
    if (items.length < 2) return;

    // Total charges from this merchant across the span the series covers.
    const chargesBetween = (from: string, to: string): number =>
      items.filter((e) => e.date >= from && e.date <= to).length;

    mergePriceChanges(buildSeries(key, items))
      .filter((series) => series.items.length >= MIN_OCCURRENCES)
      .filter((series) => {
        const dates = series.items.map((e) => e.date);
        const from = dates[0];
        const to = dates[dates.length - 1];
        const span = Math.max(1, Math.abs(daysBetween(from, to)));
        const spec = CADENCES.find((c) => c.cadence === series.cadence);
        if (!spec) return false;

        // The most charges this cadence could plausibly produce over the span.
        const plausible = span / spec.min + 1;
        if (chargesBetween(from, to) > plausible * FREQUENCY_SLACK) return false;

        if (series.items.length / items.length < MIN_COVERAGE) return false;

        return isCalendarAligned(dates, series.cadence);
      })
      .forEach((series) => {
        const dates = series.items.map((e) => e.date);
        const amounts = series.items.map((e) => Number(e.amount) || 0);

        const gaps: number[] = [];
        for (let i = 1; i < dates.length; i += 1) {
          gaps.push(Math.abs(daysBetween(dates[i - 1], dates[i])));
        }

        const typicalGap = median(gaps);
        // How tightly the gaps cluster, 0-1.
        const spread = gaps.reduce((acc, gap) => acc + Math.abs(gap - typicalGap), 0) / gaps.length;
        const tightness = Math.max(0, 1 - spread / Math.max(typicalGap * 0.4, 3));

        // The current price is what matters for the forward-looking cost.
        const amount = amounts[amounts.length - 1];
        const monthlyCost = amount * series.perMonth;
        const lastDate = dates[dates.length - 1];

        const countScore = Math.min(1, (series.items.length - 2) / 3);
        const confidence = Math.min(0.98, 0.45 + countScore * 0.25 + tightness * 0.3);

        const first = amounts[0];
        const priceCreep = amount > first * 1.05 ? { from: first, to: amount } : undefined;

        subscriptions.push({
          id: `sub_${key.replace(/\s/g, '-')}_${Math.round(amount)}_${dates[0]}`,
          merchant: prettyMerchant(key, series.label),
          category: detectCategory(series.label),
          emoji: detectEmoji(series.label),
          cadence: series.cadence,
          amount,
          occurrences: series.items.length,
          firstDate: dates[0],
          lastDate,
          nextDate: toDateKey(addDays(new Date(lastDate), Math.round(typicalGap))),
          monthlyCost,
          annualCost: monthlyCost * 12,
          confidence,
          priceCreep,
        });
      });
  });

  return subscriptions.sort((a, b) => b.annualCost - a.annualCost);
};

export interface LeechSummary {
  count: number;
  monthly: number;
  annual: number;
  /** What the annual bleed becomes if invested instead, at 12% for 5 years. */
  investedFiveYear: number;
  shareOfAllowance: number;
}

/** Future value of investing `monthly` every month for `years` at `annualRate`. */
export const investedValue = (monthly: number, years: number, annualRate = 0.12): number => {
  const months = years * 12;
  const r = annualRate / 12;
  if (monthly <= 0) return 0;
  return monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
};

export const leechSummary = (
  subscriptions: Subscription[],
  monthlyAllowance: number
): LeechSummary => {
  const monthly = subscriptions.reduce((acc, s) => acc + s.monthlyCost, 0);
  return {
    count: subscriptions.length,
    monthly,
    annual: monthly * 12,
    investedFiveYear: investedValue(monthly, 5),
    shareOfAllowance: monthlyAllowance > 0 ? monthly / monthlyAllowance : 0,
  };
};

export const cadenceLabel = (cadence: SubscriptionCadence): string =>
  cadence === 'weekly' ? 'Every week' : cadence === 'monthly' ? 'Every month' : 'Every 3 months';

export const daysUntil = (dateKey: string): number => daysBetween(toDateKey(), dateKey);
