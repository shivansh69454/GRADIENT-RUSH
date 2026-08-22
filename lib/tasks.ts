import type { DailyExpense, SavingsGoal, Task } from '@/types';
import { byCategory, expensesLastNDays, getBudgetState, sum, todayTotal } from './analytics';
import { formatCurrency } from './utils';

export interface TaskGenInput {
  expenses: DailyExpense[];
  goals: SavingsGoal[];
  monthlyAllowance: number;
  streak: number;
}

/**
 * Builds today's task list from the user's own data instead of a static six.
 *
 * Personalised tasks are generated first and the deck is topped up with
 * evergreen habits so there are always five plus one boss task.
 */
export const generateDailyTasks = (input: TaskGenInput): Task[] => {
  const { expenses, goals, monthlyAllowance } = input;
  const budget = getBudgetState(expenses, monthlyAllowance);
  const recent = expensesLastNDays(expenses, 14);
  const categories = byCategory(recent);
  const topCategory = categories[0];
  const dailyCap = Math.round(budget.safeDailyAllowance) || Math.round(monthlyAllowance / 30);

  const personalized: Task[] = [];

  if (dailyCap > 0) {
    personalized.push({
      id: 'daily-cap',
      title: `Stay under ${formatCurrency(dailyCap)} today`,
      description: `Your safe daily spend with ${budget.daysLeft} days left in the month.`,
      category: 'budgeting',
      difficulty: 'medium',
      xp_reward: 80,
      completed: false,
      personalized: true,
      targetAmount: dailyCap,
      autoKey: 'under-daily-cap',
    });
  }

  if (topCategory && topCategory.share > 0.3) {
    personalized.push({
      id: `cut-${topCategory.category.toLowerCase()}`,
      title: `Skip one ${topCategory.category} purchase`,
      description: `${topCategory.category} is ${Math.round(
        topCategory.share * 100
      )}% of your recent spending — the single biggest lever you have.`,
      category: 'saving',
      difficulty: 'medium',
      xp_reward: 70,
      completed: false,
      personalized: true,
    });
  }

  if (expenses.length === 0 || todayTotal(expenses) === 0) {
    personalized.push({
      id: 'log-first',
      title: 'Log your first expense today',
      description: 'Voice, receipt scan, or SMS paste — whichever is fastest.',
      category: 'discipline',
      difficulty: 'easy',
      xp_reward: 40,
      completed: false,
      personalized: true,
      autoKey: 'log-expense',
    });
  } else {
    personalized.push({
      id: 'log-three',
      title: 'Log 3 expenses today',
      description: 'Complete tracking is what makes every other number honest.',
      category: 'discipline',
      difficulty: 'easy',
      xp_reward: 40,
      completed: false,
      personalized: true,
      autoKey: 'log-three',
    });
  }

  const activeGoal = goals.find((g) => g.savedAmount < g.targetAmount);
  if (activeGoal) {
    const nudge = Math.max(50, Math.round((activeGoal.targetAmount - activeGoal.savedAmount) / 60));
    personalized.push({
      id: `fund-${activeGoal.id}`,
      title: `Put ${formatCurrency(nudge)} toward ${activeGoal.name}`,
      description: `${activeGoal.icon || '🎯'} You are ${Math.round(
        (activeGoal.savedAmount / activeGoal.targetAmount) * 100
      )}% of the way there.`,
      category: 'saving',
      difficulty: 'medium',
      xp_reward: 90,
      completed: false,
      personalized: true,
      targetAmount: nudge,
      autoKey: 'fund-goal',
    });
  } else {
    personalized.push({
      id: 'create-goal',
      title: 'Set a savings goal',
      description: 'Give your money a destination — even ₹2,000 for headphones counts.',
      category: 'saving',
      difficulty: 'easy',
      xp_reward: 60,
      completed: false,
      personalized: true,
      autoKey: 'create-goal',
    });
  }

  const evergreen: Task[] = [
    {
      id: 'ask-mentor',
      title: 'Ask the AI mentor one money question',
      description: 'Compound interest, SIPs, credit scores — anything you have been unsure about.',
      category: 'learning',
      difficulty: 'easy',
      xp_reward: 50,
      completed: false,
      autoKey: 'ask-mentor',
    },
    {
      id: 'study-stock',
      title: 'Study one company in Learn mode',
      description: 'Read the lesson attached to any stock on your watchlist.',
      category: 'investment',
      difficulty: 'easy',
      xp_reward: 50,
      completed: false,
      autoKey: 'study-stock',
    },
    {
      id: 'review-insights',
      title: 'Read your spending insights',
      description: 'Your nudges update every time you log something new.',
      category: 'budgeting',
      difficulty: 'easy',
      xp_reward: 30,
      completed: false,
    },
    {
      id: 'no-spend',
      title: 'Attempt a no-spend day',
      description: 'Zero rupees out. Hard mode, but the fastest way to reset a bad week.',
      category: 'discipline',
      difficulty: 'hard',
      xp_reward: 120,
      completed: false,
    },
  ];

  const deck = [...personalized, ...evergreen].slice(0, 6);
  return [...deck, buildBossTask(input, budget.safeDailyAllowance)];
};

/** The 500 XP daily boss — one hard, data-aware challenge. */
const buildBossTask = (input: TaskGenInput, dailyCap: number): Task => {
  const { expenses, monthlyAllowance } = input;
  const recent = expensesLastNDays(expenses, 7);
  const weekTotal = sum(recent);
  const categories = byCategory(recent);
  const worst = categories[0];

  if (worst && worst.total > 0) {
    return {
      id: 'boss-category-freeze',
      title: `Freeze ${worst.category} for the rest of today`,
      description: `You have put ${formatCurrency(worst.total)} into ${
        worst.category
      } this week. Zero more today and the boss goes down.`,
      category: 'discipline',
      difficulty: 'boss',
      xp_reward: 500,
      completed: false,
      personalized: true,
    };
  }

  if (weekTotal > 0 && monthlyAllowance > 0) {
    return {
      id: 'boss-half-day',
      title: `Survive today on ${formatCurrency(Math.round(dailyCap / 2))}`,
      description: 'Half your safe daily budget. Brutal, but it buys back a whole week.',
      category: 'discipline',
      difficulty: 'boss',
      xp_reward: 500,
      completed: false,
      personalized: true,
    };
  }

  return {
    id: 'boss-setup',
    title: 'Complete your financial baseline',
    description:
      'Set an allowance, log three expenses, and create one savings goal. This unlocks your Smartwise Score.',
    category: 'budgeting',
    difficulty: 'boss',
    xp_reward: 500,
    completed: false,
  };
};

/** Carries completion state across a regeneration so nothing is lost on reload. */
export const mergeTaskState = (fresh: Task[], existing: Task[]): Task[] => {
  const doneIds = new Set(existing.filter((t) => t.completed).map((t) => t.id));
  return fresh.map((t) => (doneIds.has(t.id) ? { ...t, completed: true } : t));
};
