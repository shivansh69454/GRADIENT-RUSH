import type { DailyQuote, Player } from '@/types';
import { getTodayDate } from './utils';

export const EMPTY_PLAYER: Player = {
  id: 'player_001',
  name: '',
  age: 0,
  monthly_allowance: 0,
  level: 1,
  xp_points: 0,
  total_xp_earned: 0,
  theme_preference: 'dark',
  joined_date: getTodayDate(),
  isOnboarded: false,
};

export const FINANCIAL_QUOTES: DailyQuote[] = [
  {
    id: 'q1',
    text: 'Do not save what is left after spending, but spend what is left after saving.',
    author: 'Warren Buffett',
  },
  {
    id: 'q2',
    text: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
  },
  {
    id: 'q3',
    text: 'The stock market is filled with individuals who know the price of everything, but the value of nothing.',
    author: 'Philip Fisher',
  },
  {
    id: 'q4',
    text: 'Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver.',
    author: 'Ayn Rand',
  },
  {
    id: 'q5',
    text: 'The habit of saving is itself an education; it fosters every virtue and trains to forethought.',
    author: 'T.T. Munger',
  },
  {
    id: 'q6',
    text: 'Someone is sitting in the shade today because someone planted a tree a long time ago.',
    author: 'Warren Buffett',
  },
  {
    id: 'q7',
    text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
  },
  {
    id: 'q8',
    text: 'It is not your salary that makes you rich, it is your spending habits.',
    author: 'Charles A. Jaffe',
  },
];

export const getQuoteOfTheDay = (): DailyQuote => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return FINANCIAL_QUOTES[dayOfYear % FINANCIAL_QUOTES.length];
};
