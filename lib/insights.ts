import type { DailyExpense, Insight, SavingsGoal, StreakState } from '@/types';
import {
  TIME_BUCKETS,
  byCategory,
  expensesLastNDays,
  getBudgetState,
  spendingHeat,
  sum,
} from './analytics';
import { formatCurrency, formatDuration } from './utils';

export interface InsightInput {
  expenses: DailyExpense[];
  goals: SavingsGoal[];
  streak: StreakState;
  monthlyAllowance: number;
}

/** Things a student could buy, used to make savings feel concrete. */
const REWARDS: { name: string; price: number; emoji: string }[] = [
  { name: 'a pair of AirPods', price: 12000, emoji: '🎧' },
  { name: 'a Kindle', price: 11000, emoji: '📖' },
  { name: 'a mechanical keyboard', price: 5500, emoji: '⌨️' },
  { name: 'a weekend trip to Goa', price: 15000, emoji: '🏖️' },
  { name: 'a new phone', price: 25000, emoji: '📱' },
  { name: 'a MacBook Air', price: 95000, emoji: '💻' },
  { name: 'a year of Spotify', price: 1400, emoji: '🎵' },
  { name: 'a good pair of running shoes', price: 4500, emoji: '👟' },
];

const rewardFor = (amountPerMonth: number, months = 6) => {
  const budget = amountPerMonth * months;
  const affordable = REWARDS.filter((r) => r.price <= budget).sort((a, b) => b.price - a.price);
  return affordable[0] ?? REWARDS[6];
};

/**
 * The Nudge Engine. Generates ranked, human-sounding observations from the
 * user's own data. Nothing here is hardcoded copy — every number is derived.
 */
export const generateInsights = (input: InsightInput): Insight[] => {
  const { expenses, goals, streak, monthlyAllowance } = input;
  const insights: Insight[] = [];

  if (expenses.length < 4) {
    return [
      {
        id: 'onboard-more-data',
        tone: 'neutral',
        icon: '🌱',
        title: 'Log a few more expenses',
        body: `You have ${expenses.length} ${
          expenses.length === 1 ? 'entry' : 'entries'
        } so far. After 5, Smartwise starts spotting patterns in how you spend.`,
      },
    ];
  }

  const recent = expensesLastNDays(expenses, 30);
  const categories = byCategory(recent);
  const budget = getBudgetState(expenses, monthlyAllowance);
  const total = sum(recent);

  // 1. Category concentration versus a healthy student split.
  const top = categories[0];
  if (top && top.share > top.healthyShare + 0.08) {
    const excess = (top.share - top.healthyShare) * total;
    insights.push({
      id: `cat-heavy-${top.category}`,
      tone: top.share > top.healthyShare + 0.2 ? 'danger' : 'warning',
      icon: top.emoji,
      title: `${Math.round(top.share * 100)}% of your money goes to ${top.category}`,
      body: `A typical student spends about ${Math.round(
        top.healthyShare * 100
      )}%. Pulling ${top.category} back to that line frees up roughly ${formatCurrency(
        excess
      )} a month.`,
      action: `Trim ${formatCurrency(excess / 4)}/week`,
    });
  }

  // 2. Repeat small purchases — the classic chai/coffee leak.
  const freq = new Map<string, { count: number; total: number }>();
  recent.forEach((e) => {
    const key = (e.description || '').trim().toLowerCase().slice(0, 24);
    if (!key) return;
    const entry = freq.get(key) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(e.amount) || 0;
    freq.set(key, entry);
  });
  const habit = Array.from(freq.entries())
    .filter(([, v]) => v.count >= 4)
    .sort((a, b) => b[1].total - a[1].total)[0];
  if (habit) {
    const [name, { count, total: habitTotal }] = habit;
    const perYear = habitTotal * 12;
    insights.push({
      id: `habit-${name}`,
      tone: 'warning',
      icon: '🔁',
      title: `"${name}" ${count} times this month`,
      body: `That is ${formatCurrency(habitTotal)} a month, or ${formatCurrency(
        perYear
      )} a year. Cutting it in half buys you ${rewardFor(habitTotal / 2).emoji} ${
        rewardFor(habitTotal / 2).name
      }.`,
      action: `Halve it → save ${formatCurrency(habitTotal / 2)}/mo`,
    });
  }

  // 3. When the money leaks — the heatmap insight in words.
  const heat = spendingHeat(recent);
  const hotspot = [...heat].sort((a, b) => b.total - a.total)[0];
  if (hotspot && hotspot.total > total * 0.15) {
    const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][
      hotspot.weekday
    ];
    const bucket = TIME_BUCKETS[hotspot.bucket];
    insights.push({
      id: `hotspot-${hotspot.weekday}-${hotspot.bucket}`,
      tone: 'neutral',
      icon: '🕐',
      title: `${dayName} ${bucket.label.toLowerCase()} is your danger zone`,
      body: `${formatCurrency(hotspot.total)} across ${hotspot.count} ${
        hotspot.count === 1 ? 'transaction' : 'transactions'
      } lands in ${dayName} ${bucket.hint}. That is ${Math.round(
        (hotspot.total / total) * 100
      )}% of everything you spent.`,
    });
  }

  // 4. Weekend versus weekday behaviour.
  const weekend = recent.filter((e) => {
    const d = new Date(e.date).getDay();
    return d === 0 || d === 6;
  });
  const weekendTotal = sum(weekend);
  if (weekendTotal > total * 0.4 && weekend.length >= 3) {
    insights.push({
      id: 'weekend-heavy',
      tone: 'warning',
      icon: '🌙',
      title: `Weekends eat ${Math.round((weekendTotal / total) * 100)}% of your budget`,
      body: `Two days out of seven should be closer to 29%. You are spending ${formatCurrency(
        weekendTotal / Math.max(1, new Set(weekend.map((e) => e.date)).size)
      )} per weekend day.`,
      action: 'Set a weekend cap',
    });
  }

  // 5. Budget trajectory.
  if (monthlyAllowance > 0 && budget.projectedMonthEnd > monthlyAllowance * 1.05) {
    const over = budget.projectedMonthEnd - monthlyAllowance;
    insights.push({
      id: 'projection-over',
      tone: 'danger',
      icon: '📈',
      title: `On track to overshoot by ${formatCurrency(over)}`,
      body: `At your current pace you will finish the month at ${formatCurrency(
        budget.projectedMonthEnd
      )} against a ${formatCurrency(monthlyAllowance)} allowance. Keeping each of the next ${
        budget.daysLeft
      } days under ${formatCurrency(budget.safeDailyAllowance)} fixes it.`,
      action: `Cap days at ${formatCurrency(budget.safeDailyAllowance)}`,
    });
  } else if (monthlyAllowance > 0 && budget.projectedMonthEnd > 0 && budget.projectedMonthEnd < monthlyAllowance * 0.8) {
    const surplus = monthlyAllowance - budget.projectedMonthEnd;
    insights.push({
      id: 'projection-under',
      tone: 'positive',
      icon: '✨',
      title: `You are on pace to save ${formatCurrency(surplus)}`,
      body: `Finish the month like this and you keep ${Math.round(
        (surplus / monthlyAllowance) * 100
      )}% of your allowance. Invested at 12% a year, that becomes ${formatCurrency(
        surplus * 12 * 1.12
      )} in twelve months.`,
      action: 'Move it to a goal',
    });
  }

  // 6. Goal pace.
  const laggingGoal = goals
    .filter((g) => g.savedAmount < g.targetAmount)
    .sort((a, b) => a.savedAmount / a.targetAmount - b.savedAmount / b.targetAmount)[0];
  if (laggingGoal) {
    const monthlyPace = Math.max(0, monthlyAllowance - budget.projectedMonthEnd);
    const remaining = laggingGoal.targetAmount - laggingGoal.savedAmount;
    const months = monthlyPace > 0 ? remaining / monthlyPace : Infinity;
    insights.push({
      id: `goal-pace-${laggingGoal.id}`,
      tone: months > 24 ? 'warning' : 'neutral',
      icon: laggingGoal.icon || '🎯',
      title: `${laggingGoal.name}: ${formatDuration(months)} to go`,
      body:
        monthlyPace > 0
          ? `You are saving about ${formatCurrency(
              monthlyPace
            )} a month. Adding ${formatCurrency(500)} more monthly pulls this in to ${formatDuration(
              remaining / (monthlyPace + 500)
            )}.`
          : `You are not saving anything this month, so this goal is not moving. Even ${formatCurrency(
              500
            )} a month gets you there in ${formatDuration(remaining / 500)}.`,
    });
  }

  // 7. Streak reinforcement.
  if (streak.current >= 3) {
    insights.push({
      id: 'streak-alive',
      tone: 'positive',
      icon: '🔥',
      title: `${streak.current}-day logging streak`,
      body:
        streak.current >= 7
          ? `You have earned the 2× XP multiplier. Your best run is ${streak.best} days — keep going.`
          : `${7 - streak.current} more ${
              7 - streak.current === 1 ? 'day' : 'days'
            } unlocks the 2× XP multiplier.`,
    });
  }

  // 8. Biggest single hit.
  const biggest = [...recent].sort((a, b) => b.amount - a.amount)[0];
  if (biggest && biggest.amount > total * 0.2) {
    insights.push({
      id: `biggest-${biggest.id}`,
      tone: 'neutral',
      icon: '🔍',
      title: `${biggest.description || 'One purchase'} was ${Math.round(
        (biggest.amount / total) * 100
      )}% of your month`,
      body: `${formatCurrency(biggest.amount)} in a single go. Large one-offs are fine when planned — worth adding to a savings goal next time.`,
    });
  }

  const order: Record<Insight['tone'], number> = { danger: 0, warning: 1, neutral: 2, positive: 3 };
  return insights.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 6);
};
