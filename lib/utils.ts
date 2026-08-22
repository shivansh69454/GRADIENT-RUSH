import type { LevelInfo } from '@/types';

export const XP_PER_LEVEL = 1000;
export const MAX_LEVEL = 100;

export const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

// ------------------------------------------------------------------ levelling

export const calculateLevel = (totalXP: number): number =>
  clamp(Math.floor(Math.max(0, totalXP) / XP_PER_LEVEL) + 1, 1, MAX_LEVEL);

export const getCurrentLevelXP = (totalXP: number): number =>
  Math.max(0, totalXP) % XP_PER_LEVEL;

export const calculateLevelProgress = (totalXP: number): number =>
  clamp((getCurrentLevelXP(totalXP) / XP_PER_LEVEL) * 100, 0, 100);

export const getXPForNextLevel = (totalXP: number): number => {
  const level = calculateLevel(totalXP);
  if (level >= MAX_LEVEL) return 0;
  return level * XP_PER_LEVEL - totalXP;
};

export const getLevelTitle = (level: number): string => {
  if (level >= 90) return 'Financial Master';
  if (level >= 75) return 'Investment Guru';
  if (level >= 60) return 'Money Expert';
  if (level >= 45) return 'Budget Pro';
  if (level >= 30) return 'Savings Champion';
  if (level >= 15) return 'Finance Apprentice';
  if (level >= 5) return 'Budget Ninja';
  return 'Finance Rookie';
};

export const getLevelInfo = (totalXP: number): LevelInfo => {
  const level = calculateLevel(totalXP);
  return {
    level,
    xpRequired: XP_PER_LEVEL,
    xpStart: (level - 1) * XP_PER_LEVEL,
    xpEnd: level * XP_PER_LEVEL - 1,
    title: getLevelTitle(level),
  };
};

/** Course discount unlocked by levelling: 5% every 20 levels, capped at 25%. */
export const getLevelDiscount = (level: number): number =>
  Math.min(Math.floor(level / 20) * 5, 25);

// ------------------------------------------------------------------ formatting

export const formatCurrency = (amount: number, compact = false): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (compact && Math.abs(safe) >= 10000000)
    return `₹${(safe / 10000000).toFixed(safe % 10000000 === 0 ? 0 : 1)}Cr`;
  if (compact && Math.abs(safe) >= 100000)
    return `₹${(safe / 100000).toFixed(safe % 100000 === 0 ? 0 : 1)}L`;
  if (compact && Math.abs(safe) >= 1000)
    return `₹${(safe / 1000).toFixed(safe % 1000 === 0 ? 0 : 1)}k`;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(safe));
};

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value || 0));

export const formatDate = (dateString: string): string =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(dateString)
  );

export const formatShortDate = (dateString: string): string =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(dateString));

export const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatShortDate(new Date(timestamp).toISOString());
};

/** Months rendered as "1 yr 6 mo" so ETAs read like a human wrote them. */
export const formatDuration = (months: number): string => {
  if (!Number.isFinite(months) || months <= 0) return 'Already there';
  const rounded = Math.ceil(months);
  if (rounded > 1200) return 'Over 100 years';
  const years = Math.floor(rounded / 12);
  const rem = rounded % 12;
  if (years === 0) return `${rem} ${rem === 1 ? 'month' : 'months'}`;
  if (rem === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
  return `${years} yr ${rem} mo`;
};

// ------------------------------------------------------------------ dates

/** Local-time YYYY-MM-DD. `toISOString` shifts to UTC and breaks IST evenings. */
export const toDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getTodayDate = (): string => toDateKey();

export const getMonthKey = (date: Date = new Date()): string => toDateKey(date).slice(0, 7);

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const daysBetween = (a: string, b: string): number =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

/** Monday-anchored week start, matching how Indian students think about weeks. */
export const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const daysInMonth = (date: Date = new Date()): number =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

export const daysLeftInMonth = (date: Date = new Date()): number =>
  daysInMonth(date) - date.getDate() + 1;

export const uid = (prefix = 'id'): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
