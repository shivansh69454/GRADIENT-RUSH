import type { DailyExpense, SavingsGoal } from '@/types';
import { expensesThisWeek, sum } from './analytics';
import { getWeekStart, toDateKey } from './utils';

export interface BattleCard {
  /** Battle code both sides share. */
  c: string;
  /** Display name. */
  n: string;
  /** Amount saved this week. */
  s: number;
  /** Expenses logged this week. */
  l: number;
  /** Monday of the contested week. */
  w: string;
  /** Streak, shown as a tiebreaker. */
  k: number;
}

/** Six digits, human-readable over a phone call. */
export const generateCode = (): string =>
  String(Math.floor(100000 + Math.random() * 900000));

const toBase64Url = (input: string): string =>
  btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (input: string): string => {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  return decodeURIComponent(escape(atob(withPadding)));
};

export const encodeCard = (card: BattleCard): string => toBase64Url(JSON.stringify(card));

export const decodeCard = (token: string): BattleCard | null => {
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as BattleCard;
    if (!parsed.c || typeof parsed.s !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
};

/**
 * Accepts a raw token, a full Smartwise battle URL, or a bare 6-digit code and
 * returns whatever it can. A bare code carries no stats, which the UI explains.
 */
export const parseInvite = (
  input: string
): { card: BattleCard | null; code: string | null } => {
  const trimmed = input.trim();
  if (!trimmed) return { card: null, code: null };

  const bareCode = trimmed.match(/^\d{6}$/);
  if (bareCode) return { card: null, code: bareCode[0] };

  // Pull the payload out of a pasted URL if there is one.
  let token = trimmed;
  const urlMatch = trimmed.match(/[?&]b=([A-Za-z0-9\-_]+)/);
  if (urlMatch) token = urlMatch[1];

  const card = decodeCard(token);
  return { card, code: card?.c ?? null };
};

/** This week's performance, computed the same way for both players. */
export const buildCard = (
  code: string,
  name: string,
  expenses: DailyExpense[],
  goals: SavingsGoal[],
  monthlyAllowance: number,
  streak: number
): BattleCard => {
  const week = expensesThisWeek(expenses);
  const weeklyBudget = (monthlyAllowance / 30) * 7;
  const spent = sum(week);

  // Saved = what you did not spend against your own weekly budget, plus what
  // you actively moved into goals this week.
  const contributedThisWeek = goals.reduce((acc, goal) => {
    const weekStart = toDateKey(getWeekStart());
    const contributions = (goal.contributions ?? []).filter((c) => c.date >= weekStart);
    return acc + contributions.reduce((a, c) => a + c.amount, 0);
  }, 0);

  return {
    c: code,
    n: name || 'Player',
    s: Math.round(Math.max(0, weeklyBudget - spent) + contributedThisWeek),
    l: week.length,
    w: toDateKey(getWeekStart()),
    k: streak,
  };
};

export type BattleOutcome = 'winning' | 'losing' | 'tied';

export const compareCards = (you: BattleCard, rival: BattleCard): BattleOutcome => {
  if (you.s > rival.s) return 'winning';
  if (you.s < rival.s) return 'losing';
  // Tiebreaker: whoever tracked more diligently.
  if (you.l > rival.l) return 'winning';
  if (you.l < rival.l) return 'losing';
  return 'tied';
};

export const buildShareUrl = (card: BattleCard): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/split?b=${encodeCard(card)}`;
};
