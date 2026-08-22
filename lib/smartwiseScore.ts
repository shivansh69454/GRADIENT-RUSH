import type {
  DailyExpense,
  SavingsGoal,
  SmartwiseScorePillar,
  SmartwiseScoreResult,
  StreakState,
  Task,
} from '@/types';
import {
  expensesLastNDays,
  getBudgetState,
  goalsProgressRatio,
  monthTotal,
  totalSaved,
} from './analytics';
import { clamp, formatCurrency, toDateKey } from './utils';

export interface SmartwiseScoreInput {
  expenses: DailyExpense[];
  goals: SavingsGoal[];
  tasks: Task[];
  streak: StreakState;
  monthlyAllowance: number;
}

const WEIGHTS = {
  savings: 30,
  budget: 25,
  tasks: 20,
  goals: 15,
  consistency: 10,
} as const;

const gradeFor = (score: number): SmartwiseScoreResult['grade'] => {
  if (score >= 85) return 'Elite';
  if (score >= 71) return 'Strong';
  if (score >= 55) return 'Stable';
  if (score >= 41) return 'Fragile';
  return 'Critical';
};

const bandFor = (score: number): SmartwiseScoreResult['band'] => {
  if (score >= 71) return 'positive';
  if (score >= 41) return 'warning';
  return 'negative';
};

/**
 * Smartwise Score — one 0-100 number for financial health.
 *
 * Every pillar is normalised to 0-1 before weighting so a student with a ₹5,000
 * allowance is judged on the same curve as one with ₹50,000.
 */
export const computeSmartwiseScore = (input: SmartwiseScoreInput): SmartwiseScoreResult => {
  const { expenses, goals, tasks, streak, monthlyAllowance } = input;

  const spent = monthTotal(expenses);
  const budget = getBudgetState(expenses, monthlyAllowance);

  // 1. Savings rate — what share of the allowance survived the month.
  const savingsRate = monthlyAllowance > 0 ? (monthlyAllowance - spent) / monthlyAllowance : 0;
  // A 20% savings rate is the target and scores full marks.
  const savingsRatio = clamp(savingsRate / 0.2, 0, 1);

  // 2. Budget adherence — how close projected spend is to the allowance.
  const projectionRatio =
    monthlyAllowance > 0 && budget.projectedMonthEnd > 0
      ? budget.projectedMonthEnd / monthlyAllowance
      : 0;
  const budgetRatio =
    projectionRatio === 0 ? 0.5 : clamp(1 - Math.max(0, projectionRatio - 0.85) / 0.5, 0, 1);

  // 3. Task completion today.
  const doneTasks = tasks.filter((t) => t.completed).length;
  const taskRatio = tasks.length > 0 ? doneTasks / tasks.length : 0;

  // 4. Goal progress.
  const goalRatio = goalsProgressRatio(goals);

  // 5. Consistency — logging days out of the last 14, boosted by streak.
  const recent = expensesLastNDays(expenses, 14);
  const distinctDays = new Set(recent.map((e) => e.date)).size;
  const loggingRatio = clamp(distinctDays / 10, 0, 1);
  const streakRatio = clamp(streak.current / 14, 0, 1);
  const consistencyRatio = clamp(loggingRatio * 0.65 + streakRatio * 0.35, 0, 1);

  const pillars: SmartwiseScorePillar[] = [
    {
      key: 'savings',
      label: 'Savings rate',
      ratio: savingsRatio,
      weight: WEIGHTS.savings,
      points: savingsRatio * WEIGHTS.savings,
      detail:
        monthlyAllowance > 0
          ? `${Math.round(savingsRate * 100)}% of your allowance is unspent`
          : 'Set a monthly allowance to unlock this',
    },
    {
      key: 'budget',
      label: 'Budget adherence',
      ratio: budgetRatio,
      weight: WEIGHTS.budget,
      points: budgetRatio * WEIGHTS.budget,
      detail:
        budget.projectedMonthEnd > 0
          ? `On pace for ${formatCurrency(budget.projectedMonthEnd)} this month`
          : 'Log a few expenses to project your month',
    },
    {
      key: 'tasks',
      label: 'Daily discipline',
      ratio: taskRatio,
      weight: WEIGHTS.tasks,
      points: taskRatio * WEIGHTS.tasks,
      detail: `${doneTasks} of ${tasks.length || 0} tasks done today`,
    },
    {
      key: 'goals',
      label: 'Goal progress',
      ratio: goalRatio,
      weight: WEIGHTS.goals,
      points: goalRatio * WEIGHTS.goals,
      detail:
        goals.length > 0
          ? `${formatCurrency(totalSaved(goals))} saved across ${goals.length} ${
              goals.length === 1 ? 'goal' : 'goals'
            }`
          : 'Add a savings goal to earn these points',
    },
    {
      key: 'consistency',
      label: 'Tracking consistency',
      ratio: consistencyRatio,
      weight: WEIGHTS.consistency,
      points: consistencyRatio * WEIGHTS.consistency,
      detail: `Logged on ${distinctDays} of the last 14 days · ${streak.current}-day streak`,
    },
  ];

  const score = Math.round(pillars.reduce((acc, p) => acc + p.points, 0));

  return {
    score: clamp(score, 0, 100),
    grade: gradeFor(score),
    band: bandFor(score),
    pillars,
    delta: 0,
    hasEnoughData: expenses.length >= 3 && monthlyAllowance > 0,
  };
};

/**
 * Records today's score and returns the change versus the reading from roughly
 * a week ago, so the dashboard can show "↑ 12 this week".
 */
export const trackScore = (
  score: number,
  history: { date: string; score: number }[]
): { history: { date: string; score: number }[]; delta: number } => {
  const today = toDateKey();
  const withoutToday = history.filter((h) => h.date !== today);
  const next = [...withoutToday, { date: today, score }].slice(-60);

  const weekAgo = toDateKey(new Date(Date.now() - 7 * 86400000));
  const past = withoutToday.filter((h) => h.date <= weekAgo).pop() ?? withoutToday[0];
  const delta = past ? score - past.score : 0;

  return { history: next, delta };
};

export const weakestPillar = (result: SmartwiseScoreResult): SmartwiseScorePillar =>
  [...result.pillars].sort((a, b) => a.ratio - b.ratio)[0];

export const strongestPillar = (result: SmartwiseScoreResult): SmartwiseScorePillar =>
  [...result.pillars].sort((a, b) => b.ratio - a.ratio)[0];
