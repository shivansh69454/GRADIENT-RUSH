import type { DailyExpense, ExpenseCategory, SavingsGoal } from '@/types';
import { addDays, toDateKey, uid } from './utils';

/**
 * Seeds a believable three months of history.
 *
 * Several features only have something to say once there is a real pattern to
 * find: the subscription radar needs repeat charges on a cadence, the forecast
 * needs closed months to measure volatility from, the heatmap needs timestamps
 * spread across the week. A fresh install has none of that, so this generates
 * it — deterministically, from a fixed seed, so the demo tells the same story
 * every time.
 */

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

interface Merchant {
  name: string;
  category: ExpenseCategory;
  min: number;
  max: number;
  /** Chance of appearing on any given day. */
  frequency: number;
  /** Hours the purchase realistically happens in. */
  hours: number[];
}

const MERCHANTS: Merchant[] = [
  { name: 'Chai Point', category: 'Food', min: 30, max: 60, frequency: 0.62, hours: [8, 9, 17, 18] },
  { name: 'Swiggy', category: 'Food', min: 180, max: 420, frequency: 0.34, hours: [13, 21, 22, 23] },
  { name: 'Zomato', category: 'Food', min: 160, max: 380, frequency: 0.2, hours: [14, 21, 22] },
  { name: 'College Canteen', category: 'Food', min: 40, max: 110, frequency: 0.45, hours: [12, 13, 16] },
  { name: 'Rapido', category: 'Transport', min: 45, max: 130, frequency: 0.4, hours: [9, 10, 18, 19] },
  { name: 'Metro Card', category: 'Transport', min: 30, max: 90, frequency: 0.28, hours: [8, 9, 19] },
  { name: 'Uber', category: 'Transport', min: 120, max: 320, frequency: 0.06, hours: [22, 23, 1] },
  { name: 'Blinkit', category: 'Groceries', min: 120, max: 480, frequency: 0.14, hours: [11, 20, 21] },
  { name: 'Zepto', category: 'Groceries', min: 90, max: 350, frequency: 0.1, hours: [19, 20, 22] },
  { name: 'Myntra', category: 'Shopping', min: 599, max: 2400, frequency: 0.03, hours: [15, 22] },
  { name: 'Amazon', category: 'Shopping', min: 250, max: 1800, frequency: 0.045, hours: [13, 21] },
  { name: 'BookMyShow', category: 'Entertainment', min: 250, max: 700, frequency: 0.045, hours: [18, 19, 20] },
  { name: 'Steam', category: 'Entertainment', min: 300, max: 1200, frequency: 0.018, hours: [23, 0] },
  { name: 'Xerox Shop', category: 'Education', min: 20, max: 90, frequency: 0.18, hours: [11, 14, 16] },
  { name: 'PharmEasy', category: 'Health', min: 120, max: 460, frequency: 0.05, hours: [12, 20] },
];

/** The quiet recurring charges the subscription radar is built to surface. */
const SUBSCRIPTIONS: { name: string; category: ExpenseCategory; amount: number; dayOfMonth: number; hikeTo?: number }[] = [
  { name: 'Netflix India', category: 'Entertainment', amount: 199, dayOfMonth: 8, hikeTo: 249 },
  { name: 'Spotify Premium', category: 'Entertainment', amount: 119, dayOfMonth: 14 },
  { name: 'Airtel Postpaid', category: 'Bills', amount: 399, dayOfMonth: 3 },
  { name: 'Cult Fit', category: 'Health', amount: 999, dayOfMonth: 21 },
  { name: 'Google One', category: 'Bills', amount: 130, dayOfMonth: 27 },
];

const RENT = { name: 'Hostel Rent', category: 'Rent' as ExpenseCategory, amount: 3500, dayOfMonth: 2 };

/**
 * Scales down how often the discretionary merchants fire.
 *
 * Tuned so the generated student spends a bit under their allowance in a good
 * month and a bit over in a bad one. That variance is the point — a demo user
 * who always saves has nothing for the forecast or Survival Mode to react to,
 * and one who always overspends makes every goal look impossible.
 */
const DISCRETIONARY_DAMPING = 0.52;

export interface DemoSeed {
  expenses: DailyExpense[];
  goals: SavingsGoal[];
  activeDates: string[];
}

/**
 * Days of history, counted back to the 1st of the month three months ago.
 *
 * Starting on a month boundary matters: the savings history deliberately ignores
 * partial months, so a ragged start date would throw away a third of the
 * generated data and leave the forecast with almost nothing to measure.
 */
const daysOfHistory = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  return Math.round((now.getTime() - start.getTime()) / 86400000) + 1;
};

export const buildDemoData = (monthlyAllowance: number): DemoSeed => {
  const rand = mulberry32(77_2026);
  const allowanceFactor = monthlyAllowance > 0 ? monthlyAllowance / 15000 : 1;
  const expenses: DailyExpense[] = [];
  const historyDays = daysOfHistory();

  for (let back = historyDays - 1; back >= 0; back -= 1) {
    const day = addDays(new Date(), -back);
    const dateKey = toDateKey(day);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

    // A couple of quiet days a month keeps the heatmap honest. Fixed charges
    // below still land — a direct debit does not care that you stayed in.
    const quietDay = rand() < 0.05;

    MERCHANTS.forEach((merchant) => {
      if (quietDay) return;
      // Weekends skew towards eating out and going out.
      const weekendBoost =
        isWeekend && ['Food', 'Entertainment', 'Transport'].includes(merchant.category) ? 1.6 : 1;
      if (rand() > merchant.frequency * weekendBoost * DISCRETIONARY_DAMPING) return;

      const spread = merchant.max - merchant.min;
      const amount = Math.round(
        (merchant.min + rand() * spread) * (0.85 + allowanceFactor * 0.15)
      );
      const hour = merchant.hours[Math.floor(rand() * merchant.hours.length)];
      const stamp = new Date(day);
      stamp.setHours(hour, Math.floor(rand() * 60), 0, 0);

      expenses.push({
        id: uid('demo'),
        amount,
        description: merchant.name,
        category: merchant.category,
        date: dateKey,
        timestamp: stamp.getTime(),
        source: rand() < 0.3 ? 'sms' : 'manual',
      });
    });

    // Fixed monthly charges land on their day, every month.
    const dayOfMonth = day.getDate();
    SUBSCRIPTIONS.forEach((sub) => {
      if (dayOfMonth !== sub.dayOfMonth) return;
      // The most recent charge carries the price hike, so the creep is visible.
      const isRecent = back < 31;
      const stamp = new Date(day);
      stamp.setHours(4, 12, 0, 0);
      expenses.push({
        id: uid('demo'),
        amount: isRecent && sub.hikeTo ? sub.hikeTo : sub.amount,
        description: sub.name,
        category: sub.category,
        date: dateKey,
        timestamp: stamp.getTime(),
        source: 'sms',
      });
    });

    if (dayOfMonth === RENT.dayOfMonth) {
      const stamp = new Date(day);
      stamp.setHours(10, 0, 0, 0);
      expenses.push({
        id: uid('demo'),
        amount: RENT.amount,
        description: RENT.name,
        category: RENT.category,
        date: dateKey,
        timestamp: stamp.getTime(),
        source: 'manual',
      });
    }
  }

  const today = toDateKey();
  const goals: SavingsGoal[] = [
    {
      id: uid('goal'),
      name: 'Emergency fund',
      targetAmount: 25000,
      savedAmount: 8200,
      category: 'Safety',
      icon: '🛡️',
      createdAt: toDateKey(addDays(new Date(), -70)),
      monthlyContribution: 2000,
      contributions: [
        { date: toDateKey(addDays(new Date(), -70)), amount: 4200 },
        { date: toDateKey(addDays(new Date(), -35)), amount: 2000 },
        { date: toDateKey(addDays(new Date(), -6)), amount: 2000 },
      ],
    },
    {
      id: uid('goal'),
      name: 'iPhone upgrade',
      targetAmount: 62000,
      savedAmount: 9500,
      category: 'Want',
      icon: '📱',
      createdAt: toDateKey(addDays(new Date(), -40)),
      monthlyContribution: 3000,
      contributions: [{ date: toDateKey(addDays(new Date(), -40)), amount: 9500 }],
    },
    {
      id: uid('goal'),
      name: 'Goa trip',
      targetAmount: 15000,
      savedAmount: 14100,
      category: 'Experience',
      icon: '🏖️',
      createdAt: toDateKey(addDays(new Date(), -55)),
      monthlyContribution: 2500,
      contributions: [
        { date: toDateKey(addDays(new Date(), -55)), amount: 7000 },
        { date: toDateKey(addDays(new Date(), -20)), amount: 7100 },
      ],
    },
  ];

  // Streak history: an unbroken recent run plus a patchier stretch before it.
  const activeDates: string[] = [];
  for (let back = 0; back < 26; back += 1) {
    const key = toDateKey(addDays(new Date(), -back));
    if (back < 9 || rand() > 0.35) activeDates.push(key);
  }
  if (!activeDates.includes(today)) activeDates.push(today);

  return { expenses, goals, activeDates };
};
