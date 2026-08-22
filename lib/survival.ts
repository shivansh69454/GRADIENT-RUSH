import type {
  DailyExpense,
  SurvivalCut,
  SurvivalDay,
  SurvivalPlan,
  SurvivalState,
} from '@/types';
import type { BudgetState } from './analytics';
import { expensesLastNDays, expensesOn, sum } from './analytics';
import { getCategoryMeta } from './categories';
import { addDays, daysBetween, formatCurrency, toDateKey } from './utils';

/**
 * Survival Mode — the plan you need when the month is already lost.
 *
 * A budget app that only says "you overspent" is useless at exactly the moment
 * it matters. This builds a concrete, short rescue plan out of the user's own
 * recent spending: a hard daily cap, which categories have to give, and the
 * specific swaps that get there. Short by design — a week is survivable, a
 * month of austerity is not.
 */

/** Categories that keep you alive and should be cut last. */
const ESSENTIAL = new Set(['Rent', 'Bills', 'Health', 'Education']);

/** How much of its recent average each category is allowed to keep. */
const SQUEEZE: Record<string, number> = {
  Entertainment: 0,
  Shopping: 0,
  Food: 0.45,
  Transport: 0.6,
  Groceries: 0.8,
  Other: 0.3,
};

const LOOKBACK_DAYS = 14;

export const buildSurvivalPlan = (
  expenses: DailyExpense[],
  budget: BudgetState
): SurvivalPlan => {
  const today = new Date();
  // A week is the sweet spot: long enough to matter, short enough to finish.
  const days = Math.max(1, Math.min(7, budget.daysLeft));
  const startDate = toDateKey(today);
  const endDate = toDateKey(addDays(today, days - 1));

  const recent = expensesLastNDays(expenses, LOOKBACK_DAYS);
  const activeDays = new Set(recent.map((e) => e.date)).size || 1;
  const baselineDaily = sum(recent) / activeDays;

  // What the maths says is actually available per day for the rescue window.
  const affordableDaily =
    budget.remaining > 0
      ? budget.remaining / Math.max(1, budget.daysLeft)
      : // Already over budget: allow essentials only, at 40% of recent burn.
        baselineDaily * 0.4;

  const perCategory = new Map<string, number>();
  recent.forEach((e) => {
    const key = getCategoryMeta(e.category).key;
    perCategory.set(key, (perCategory.get(key) ?? 0) + (Number(e.amount) || 0));
  });

  const cuts: SurvivalCut[] = Array.from(perCategory.entries())
    .map(([category, total]) => {
      const currentDaily = total / activeDays;
      const keep = ESSENTIAL.has(category) ? 1 : (SQUEEZE[category] ?? 0.5);
      const cappedDaily = currentDaily * keep;
      return {
        category,
        emoji: getCategoryMeta(category).emoji,
        currentDaily,
        cappedDaily,
        dailySaving: currentDaily - cappedDaily,
      };
    })
    .filter((cut) => cut.dailySaving > 1)
    .sort((a, b) => b.dailySaving - a.dailySaving);

  // The cap is whatever the cuts leave behind, but never above what we can afford.
  const cutDaily = cuts.reduce((acc, c) => acc + c.dailySaving, 0);
  const dailyCap = Math.max(
    0,
    Math.round(Math.min(Math.max(baselineDaily - cutDaily, 0), Math.max(affordableDaily, 0)))
  );

  const swaps = buildSwaps(recent, activeDays, cuts);

  const reason =
    budget.remaining < 0
      ? `You are ${formatCurrency(Math.abs(budget.remaining))} past your allowance with ${budget.daysLeft} days still to go.`
      : budget.status === 'critical'
        ? `${formatCurrency(budget.remaining)} left for ${budget.daysLeft} days. That is ${formatCurrency(affordableDaily)} a day.`
        : `Your pace projects ${formatCurrency(budget.projectedMonthEnd)} this month against a ${formatCurrency(budget.monthlyAllowance)} allowance.`;

  return {
    startDate,
    endDate,
    days,
    dailyCap,
    totalCap: dailyCap * days,
    baselineDaily,
    cuts,
    swaps,
    reason,
  };
};

/** Concrete, countable trades pulled from what the user actually bought. */
const buildSwaps = (
  recent: DailyExpense[],
  activeDays: number,
  cuts: SurvivalCut[]
): string[] => {
  const swaps: string[] = [];

  // Repeat merchants are the easiest, least painful thing to drop.
  const byMerchant = new Map<string, { count: number; total: number; label: string }>();
  recent.forEach((e) => {
    const label = (e.description || '').trim();
    if (label.length < 3) return;
    const key = label.toLowerCase();
    const entry = byMerchant.get(key) ?? { count: 0, total: 0, label };
    entry.count += 1;
    entry.total += Number(e.amount) || 0;
    byMerchant.set(key, entry);
  });

  Array.from(byMerchant.values())
    .filter((m) => m.count >= 2)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .forEach((m) => {
      const perDay = m.total / activeDays;
      swaps.push(
        `${m.label} cost you ${formatCurrency(m.total)} across ${m.count} orders in ${LOOKBACK_DAYS} days. Skipping it saves about ${formatCurrency(perDay)} a day.`
      );
    });

  cuts.slice(0, 2).forEach((cut) => {
    if (cut.cappedDaily <= 0) {
      swaps.push(
        `${cut.emoji} ${cut.category} goes to zero for now — that alone is ${formatCurrency(cut.dailySaving)} a day back.`
      );
    } else {
      swaps.push(
        `${cut.emoji} Bring ${cut.category} from ${formatCurrency(cut.currentDaily)} to ${formatCurrency(cut.cappedDaily)} a day.`
      );
    }
  });

  if (swaps.length === 0) {
    swaps.push('Log every rupee for the next few days. You cannot cut what you cannot see.');
  }

  return swaps.slice(0, 4);
};

export interface SurvivalProgress {
  days: SurvivalDay[];
  daysSurvived: number;
  daysBroken: number;
  daysRemaining: number;
  todaySpent: number;
  todayRemaining: number;
  /** Dates that are complete, under cap, and not yet paid out. */
  unrewarded: string[];
  complete: boolean;
  /** True while no day has been blown yet. */
  perfect: boolean;
  saved: number;
}

export const XP_PER_SURVIVED_DAY = 120;
export const XP_PERFECT_BONUS = 400;

export const evaluateSurvival = (
  state: SurvivalState,
  expenses: DailyExpense[]
): SurvivalProgress | null => {
  if (!state.active || !state.plan) return null;

  const { plan } = state;
  const todayKey = toDateKey();
  const days: SurvivalDay[] = [];

  for (let i = 0; i < plan.days; i += 1) {
    const date = toDateKey(addDays(new Date(plan.startDate), i));
    const spent = sum(expensesOn(expenses, date));
    const elapsed = daysBetween(date, todayKey);

    let status: SurvivalDay['status'];
    if (elapsed < 0) status = 'upcoming';
    else if (elapsed === 0) status = 'today';
    else status = spent <= plan.dailyCap ? 'survived' : 'broken';

    days.push({ date, spent, cap: plan.dailyCap, status });
  }

  const finished = days.filter((d) => d.status === 'survived' || d.status === 'broken');
  const survived = finished.filter((d) => d.status === 'survived');
  const today = days.find((d) => d.status === 'today');
  const todaySpent = today?.spent ?? 0;

  // Money kept versus carrying on at the old pace.
  const saved = finished.reduce(
    (acc, d) => acc + Math.max(0, plan.baselineDaily - d.spent),
    0
  );

  return {
    days,
    daysSurvived: survived.length,
    daysBroken: finished.length - survived.length,
    daysRemaining: plan.days - finished.length,
    todaySpent,
    todayRemaining: plan.dailyCap - todaySpent,
    unrewarded: survived
      .map((d) => d.date)
      .filter((date) => !state.rewardedDates.includes(date)),
    complete: finished.length >= plan.days,
    perfect: finished.length > 0 && survived.length === finished.length,
    saved,
  };
};

/** Whether the app should be offering the rescue plan at all. */
export const shouldOfferSurvival = (budget: BudgetState): boolean =>
  budget.monthlyAllowance > 0 &&
  (budget.status === 'over' || budget.status === 'critical' || budget.status === 'tight');
