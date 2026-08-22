import type { DailyExpense, SavingsGoal } from '@/types';
import { CATEGORIES, getCategoryMeta } from './categories';
import {
  addDays,
  daysInMonth,
  daysLeftInMonth,
  getMonthKey,
  getWeekStart,
  toDateKey,
} from './utils';

export interface CategoryTotal {
  category: string;
  emoji: string;
  color: string;
  total: number;
  share: number;
  count: number;
  healthyShare: number;
}

export interface DayTotal {
  date: string;
  label: string;
  total: number;
  count: number;
}

export const sum = (expenses: DailyExpense[]): number =>
  expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

export const expensesOn = (expenses: DailyExpense[], date: string): DailyExpense[] =>
  expenses.filter((e) => e.date === date);

export const expensesInMonth = (expenses: DailyExpense[], monthKey = getMonthKey()): DailyExpense[] =>
  expenses.filter((e) => e.date?.startsWith(monthKey));

export const expensesInRange = (
  expenses: DailyExpense[],
  startKey: string,
  endKey: string
): DailyExpense[] => expenses.filter((e) => e.date >= startKey && e.date <= endKey);

export const expensesThisWeek = (expenses: DailyExpense[]): DailyExpense[] => {
  const start = toDateKey(getWeekStart());
  const end = toDateKey(addDays(getWeekStart(), 6));
  return expensesInRange(expenses, start, end);
};

export const expensesLastNDays = (expenses: DailyExpense[], n: number): DailyExpense[] => {
  const start = toDateKey(addDays(new Date(), -(n - 1)));
  return expenses.filter((e) => e.date >= start);
};

export const todayTotal = (expenses: DailyExpense[]): number =>
  sum(expensesOn(expenses, toDateKey()));

export const monthTotal = (expenses: DailyExpense[], monthKey = getMonthKey()): number =>
  sum(expensesInMonth(expenses, monthKey));

// ------------------------------------------------------------- distributions

export const byCategory = (expenses: DailyExpense[]): CategoryTotal[] => {
  const total = sum(expenses);
  const map = new Map<string, { total: number; count: number }>();
  expenses.forEach((e) => {
    const key = getCategoryMeta(e.category).key;
    const entry = map.get(key) ?? { total: 0, count: 0 };
    entry.total += Number(e.amount) || 0;
    entry.count += 1;
    map.set(key, entry);
  });

  return Array.from(map.entries())
    .map(([category, { total: catTotal, count }]) => {
      const meta = getCategoryMeta(category);
      return {
        category,
        emoji: meta.emoji,
        color: meta.color,
        total: catTotal,
        share: total > 0 ? catTotal / total : 0,
        count,
        healthyShare: meta.healthyShare,
      };
    })
    .sort((a, b) => b.total - a.total);
};

/** Trailing `days` day totals, oldest first, including zero days. */
export const dailySeries = (expenses: DailyExpense[], days: number): DayTotal[] => {
  const out: DayTotal[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = addDays(new Date(), -i);
    const key = toDateKey(d);
    const items = expensesOn(expenses, key);
    out.push({
      date: key,
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      total: sum(items),
      count: items.length,
    });
  }
  return out;
};

/** Weekday × time-of-day matrix powering the "Paisa Wasting" heatmap. */
export const TIME_BUCKETS = [
  { key: 'morning', label: 'Morning', hint: '6a–11a', from: 6, to: 11 },
  { key: 'noon', label: 'Afternoon', hint: '11a–4p', from: 11, to: 16 },
  { key: 'evening', label: 'Evening', hint: '4p–8p', from: 16, to: 20 },
  { key: 'night', label: 'Night', hint: '8p–6a', from: 20, to: 30 },
] as const;

export interface HeatCell {
  weekday: number;
  bucket: number;
  total: number;
  count: number;
}

const bucketForHour = (hour: number): number => {
  if (hour >= 6 && hour < 11) return 0;
  if (hour >= 11 && hour < 16) return 1;
  if (hour >= 16 && hour < 20) return 2;
  return 3;
};

export const spendingHeat = (expenses: DailyExpense[]): HeatCell[] => {
  const cells: HeatCell[] = [];
  for (let w = 0; w < 7; w += 1)
    for (let b = 0; b < 4; b += 1) cells.push({ weekday: w, bucket: b, total: 0, count: 0 });

  expenses.forEach((e) => {
    const when = new Date(e.timestamp || new Date(e.date).getTime());
    // Shift Sunday (0) to the end so the grid reads Mon → Sun.
    const weekday = (when.getDay() + 6) % 7;
    const bucket = bucketForHour(when.getHours());
    const cell = cells.find((c) => c.weekday === weekday && c.bucket === bucket);
    if (cell) {
      cell.total += Number(e.amount) || 0;
      cell.count += 1;
    }
  });
  return cells;
};

/** GitHub-style contribution grid over the trailing `weeks` weeks. */
export const contributionGrid = (
  activeDates: string[],
  weeks = 18
): { date: string; active: boolean; weekday: number; week: number }[] => {
  const set = new Set(activeDates);
  const cells: { date: string; active: boolean; weekday: number; week: number }[] = [];
  const end = new Date();
  const startOfThisWeek = getWeekStart(end);
  const start = addDays(startOfThisWeek, -(weeks - 1) * 7);

  for (let w = 0; w < weeks; w += 1) {
    for (let d = 0; d < 7; d += 1) {
      const day = addDays(start, w * 7 + d);
      if (day > end) continue;
      const key = toDateKey(day);
      cells.push({ date: key, active: set.has(key), weekday: d, week: w });
    }
  }
  return cells;
};

// ------------------------------------------------------------------- budgets

export interface BudgetState {
  monthlyAllowance: number;
  spentThisMonth: number;
  remaining: number;
  usedRatio: number;
  daysLeft: number;
  /** What you can spend per remaining day and still finish the month clean. */
  safeDailyAllowance: number;
  todaySpend: number;
  todayBudget: number;
  todayRemaining: number;
  overspentToday: boolean;
  status: 'healthy' | 'tight' | 'critical' | 'over';
  projectedMonthEnd: number;
}

export const getBudgetState = (
  expenses: DailyExpense[],
  monthlyAllowance: number
): BudgetState => {
  const now = new Date();
  const spentThisMonth = monthTotal(expenses);
  const remaining = monthlyAllowance - spentThisMonth;
  const daysLeft = daysLeftInMonth(now);
  const total = daysInMonth(now);
  const dayOfMonth = now.getDate();

  const safeDailyAllowance = daysLeft > 0 ? Math.max(0, remaining / daysLeft) : 0;
  const todaySpend = todayTotal(expenses);
  const todayBudget = monthlyAllowance > 0 ? safeDailyAllowance + todaySpend : 0;
  const todayRemaining = todayBudget - todaySpend;
  const usedRatio = monthlyAllowance > 0 ? spentThisMonth / monthlyAllowance : 0;
  const projectedMonthEnd = dayOfMonth > 0 ? (spentThisMonth / dayOfMonth) * total : 0;

  let status: BudgetState['status'] = 'healthy';
  if (remaining < 0) status = 'over';
  else if (usedRatio >= 0.9) status = 'critical';
  else if (monthlyAllowance > 0 && projectedMonthEnd > monthlyAllowance) status = 'tight';

  return {
    monthlyAllowance,
    spentThisMonth,
    remaining,
    usedRatio,
    daysLeft,
    safeDailyAllowance,
    todaySpend,
    todayBudget,
    todayRemaining,
    overspentToday: todayBudget > 0 && todaySpend > todayBudget,
    status,
    projectedMonthEnd,
  };
};

// ------------------------------------------------------- savings behaviour

export interface MonthlySaving {
  monthKey: string;
  spent: number;
  saved: number;
}

/**
 * What the user actually managed to keep each month they tracked.
 *
 * Only whole months count. A half-finished month always looks like a savings
 * triumph — you cannot overspend an allowance you have only had two weeks to
 * spend — and letting one in makes the pace look better and the volatility look
 * far worse than either really is. That applies at both ends: the current month,
 * and the month the ledger started partway through.
 */
export const monthlySavingsHistory = (
  expenses: DailyExpense[],
  monthlyAllowance: number
): MonthlySaving[] => {
  if (monthlyAllowance <= 0) return [];

  const byMonth = new Map<string, number>();
  let earliest: string | null = null;

  expenses.forEach((e) => {
    const date = e.date;
    if (!date) return;
    const key = date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + (Number(e.amount) || 0));
    if (earliest === null || date < earliest) earliest = date;
  });

  const now = new Date();
  const currentKey = getMonthKey(now);
  const currentIsNearlyDone = daysLeftInMonth(now) <= 3;

  // Tracking that began after the 3rd means that first month is incomplete.
  const firstMonthKey: string | null = earliest ? (earliest as string).slice(0, 7) : null;
  const firstMonthIsPartial = earliest !== null && Number((earliest as string).slice(8, 10)) > 3;

  return Array.from(byMonth.entries())
    .filter(([key]) => key !== currentKey || currentIsNearlyDone)
    .filter(([key]) => !(firstMonthIsPartial && key === firstMonthKey))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, spent]) => ({
      monthKey,
      spent,
      saved: monthlyAllowance - spent,
    }));
};

export interface SavingsProfile {
  /** Mean monthly saving, floored at zero — a negative pace cannot compound. */
  monthlyPace: number;
  /** Standard deviation of monthly saving; drives forecast uncertainty. */
  volatility: number;
  monthsObserved: number;
}

export const savingsProfile = (
  expenses: DailyExpense[],
  monthlyAllowance: number
): SavingsProfile => {
  const history = monthlySavingsHistory(expenses, monthlyAllowance);

  if (history.length === 0) {
    // No closed month yet — extrapolate this month's pace so the UI still moves.
    const spent = monthTotal(expenses);
    const now = new Date();
    const elapsed = Math.max(1, now.getDate());
    const projected = (spent / elapsed) * daysInMonth(now);
    const implied = Math.max(0, monthlyAllowance - projected);
    return {
      monthlyPace: implied,
      // A single extrapolated month is a guess, so assume wide spread.
      volatility: Math.max(implied * 0.35, monthlyAllowance * 0.08),
      monthsObserved: 0,
    };
  }

  const values = history.map((h) => h.saved);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.length > 1
      ? values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1)
      : 0;
  const observed = Math.sqrt(variance);

  return {
    monthlyPace: Math.max(0, mean),
    // Even a perfectly steady saver has some month-to-month wobble.
    volatility: Math.max(observed, Math.abs(mean) * 0.12),
    monthsObserved: history.length,
  };
};

// -------------------------------------------------------------------- goals

/** Months until a goal completes at the user's observed savings pace. */
export const goalEtaMonths = (goal: SavingsGoal, monthlyPace: number): number => {
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  if (remaining === 0) return 0;
  const pace = goal.monthlyContribution && goal.monthlyContribution > 0
    ? goal.monthlyContribution
    : monthlyPace;
  if (pace <= 0) return Infinity;
  return remaining / pace;
};

export const totalSaved = (goals: SavingsGoal[]): number =>
  goals.reduce((acc, g) => acc + (Number(g.savedAmount) || 0), 0);

export const goalsProgressRatio = (goals: SavingsGoal[]): number => {
  if (goals.length === 0) return 0;
  const ratios = goals.map((g) =>
    g.targetAmount > 0 ? Math.min(1, g.savedAmount / g.targetAmount) : 0
  );
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
};

export const ALL_CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
