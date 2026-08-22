import type { StreakState } from '@/types';
import { daysBetween, toDateKey } from './utils';

/**
 * Marks today active and recomputes the streak.
 *
 * Consecutive days extend the run, a same-day repeat is a no-op, and any gap
 * resets to 1 rather than zero — the user did show up today, after all.
 */
export const markActive = (state: StreakState, date = toDateKey()): StreakState => {
  if (state.lastActiveDate === date) return state;

  const gap = state.lastActiveDate ? daysBetween(state.lastActiveDate, date) : Infinity;
  const current = gap === 1 ? state.current + 1 : 1;
  const activeDates = state.activeDates.includes(date)
    ? state.activeDates
    : [...state.activeDates, date].slice(-400);

  return {
    current,
    best: Math.max(state.best, current),
    lastActiveDate: date,
    activeDates,
  };
};

/**
 * Recalculates the live streak on load. A streak that ended yesterday is still
 * alive today (the user has all day to log); anything older is broken.
 */
export const resolveStreak = (state: StreakState, today = toDateKey()): StreakState => {
  if (!state.lastActiveDate) return state;
  const gap = daysBetween(state.lastActiveDate, today);
  if (gap <= 1) return state;
  return { ...state, current: 0 };
};

/** XP multiplier earned by the current streak. */
export const streakMultiplier = (current: number): number => {
  if (current >= 30) return 3;
  if (current >= 7) return 2;
  if (current >= 3) return 1.5;
  return 1;
};

export const nextMultiplierAt = (current: number): number | null => {
  if (current < 3) return 3;
  if (current < 7) return 7;
  if (current < 30) return 30;
  return null;
};

export interface StreakBadge {
  days: number;
  name: string;
  emoji: string;
  unlocked: boolean;
}

export const streakBadges = (best: number): StreakBadge[] =>
  [
    { days: 3, name: 'Warming Up', emoji: '🌤️' },
    { days: 7, name: 'One Week Strong', emoji: '🔥' },
    { days: 14, name: 'Fortnight Fighter', emoji: '⚡' },
    { days: 30, name: 'Month Master', emoji: '👑' },
    { days: 100, name: 'Centurion', emoji: '💎' },
  ].map((b) => ({ ...b, unlocked: best >= b.days }));
