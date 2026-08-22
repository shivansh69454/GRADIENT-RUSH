// Mock Data for FinWise

import { Player, Transaction, Task, DailyQuote } from '@/types';
import { getTodayDate } from './utils';

// Mock Player Data
export const MOCK_PLAYER: Player = {
  id: 'player_001',
  name: '',
  age: 0,
  monthly_allowance: 0,
  level: 1,
  xp_points: 0,
  total_xp_earned: 0,
  theme_preference: 'light',
  joined_date: getTodayDate(),
  isOnboarded: false,
};

// Mock Transaction Data
export const MOCK_TRANSACTIONS: Transaction[] = [
  { 
    id: 't1', 
    user_id: 'player_001',
    amount: 3500, 
    type: 'debit', 
    merchant: 'Rent Payment', 
    category: 'Rent & Utilities', 
    date: '2025-10-01' 
  },
  { 
    id: 't2', 
    user_id: 'player_001',
    amount: 95, 
    type: 'debit', 
    merchant: 'SWIGGY FOODS', 
    category: 'Food & Dining', 
    date: '2025-10-05' 
  },
  { 
    id: 't3', 
    user_id: 'player_001',
    amount: 50000, 
    type: 'credit', 
    merchant: 'Salary Deposit', 
    category: 'Income', 
    date: '2025-10-07' 
  },
  { 
    id: 't4', 
    user_id: 'player_001',
    amount: 1500, 
    type: 'debit', 
    merchant: 'Flipkart', 
    category: 'Shopping', 
    date: '2025-10-10' 
  },
];

// Daily Financial Quotes
export const FINANCIAL_QUOTES: DailyQuote[] = [
  {
    id: 'q1',
    text: 'Do not save what is left after spending, but spend what is left after saving.',
    author: 'Warren Buffett',
    category: 'saving',
  },
  {
    id: 'q2',
    text: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
    category: 'investment',
  },
  {
    id: 'q3',
    text: 'The stock market is filled with individuals who know the price of everything, but the value of nothing.',
    author: 'Philip Fisher',
    category: 'wisdom',
  },
  {
    id: 'q4',
    text: 'Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver.',
    author: 'Ayn Rand',
    category: 'wisdom',
  },
  {
    id: 'q5',
    text: 'The habit of saving is itself an education; it fosters every virtue, teaches self-denial, cultivates the sense of order, trains to forethought.',
    author: 'T.T. Munger',
    category: 'saving',
  },
  {
    id: 'q6',
    text: 'Someone is sitting in the shade today because someone planted a tree a long time ago.',
    author: 'Warren Buffett',
    category: 'investment',
  },
  {
    id: 'q7',
    text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
    category: 'motivation',
  },
];

// Get quote of the day (rotates based on day of year)
export const getQuoteOfTheDay = (): DailyQuote => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % FINANCIAL_QUOTES.length;
  return FINANCIAL_QUOTES[index];
};

// Generate AI-based tasks based on monthly allowance
export const generateTasksForAllowance = (monthlyAllowance: number): Task[] => {
  const savingTarget = Math.floor(monthlyAllowance * 0.2); // 20% saving goal
  const dailyLimit = Math.floor(monthlyAllowance / 30);
  
  return [
    {
      id: 'task_1',
      title: 'Save for Emergency Fund',
      description: `Set aside ₹${savingTarget} this month for your emergency fund. Build financial security!`,
      category: 'saving',
      difficulty: 'medium',
      xp_reward: 50,
      completed: false,
      targetAmount: savingTarget,
    },
    {
      id: 'task_2',
      title: 'Track Daily Expenses',
      description: 'Log all your expenses for today. Stay within your daily budget!',
      category: 'budgeting',
      difficulty: 'easy',
      xp_reward: 50,
      completed: false,
    },
    {
      id: 'task_3',
      title: 'Learn About SIP',
      description: 'Read about Systematic Investment Plans (SIP) and how they help in wealth building.',
      category: 'learning',
      difficulty: 'easy',
      xp_reward: 50,
      completed: false,
    },
    {
      id: 'task_4',
      title: 'Cut Unnecessary Expense',
      description: 'Identify and skip one unnecessary purchase today. Invest the saved amount!',
      category: 'saving',
      difficulty: 'medium',
      xp_reward: 50,
      completed: false,
    },
    {
      id: 'task_5',
      title: 'Review Monthly Budget',
      description: 'Analyze your spending patterns and adjust your budget accordingly.',
      category: 'budgeting',
      difficulty: 'medium',
      xp_reward: 50,
      completed: false,
    },
    {
      id: 'task_6',
      title: `Stay Within Daily Limit`,
      description: `Keep your expenses under ₹${dailyLimit} today. Practice mindful spending!`,
      category: 'budgeting',
      difficulty: 'hard',
      xp_reward: 50,
      completed: false,
      targetAmount: dailyLimit,
    },
  ];
};

// Mock Daily Tasks
export const MOCK_DAILY_TASKS: Task[] = generateTasksForAllowance(20000);
