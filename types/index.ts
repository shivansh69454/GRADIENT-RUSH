// Type Definitions for FinWise

export type ThemePreference = 'light' | 'dark';

export type TransactionType = 'debit' | 'credit';

export type TransactionCategory = 
  | 'Food & Dining' 
  | 'Rent & Utilities' 
  | 'Shopping' 
  | 'Income' 
  | 'Entertainment'
  | 'Transportation'
  | 'Other';

export type TaskDifficulty = 'easy' | 'medium' | 'hard';

export type TaskCategory = 'saving' | 'learning' | 'budgeting' | 'investment';

export interface Player {
  id: string;
  name: string;
  age: number;
  monthly_allowance: number;
  level: number;
  xp_points: number;
  total_xp_earned: number;
  theme_preference: ThemePreference;
  joined_date: string;
  isOnboarded: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  xp_reward: number;
  completed: boolean;
  deadline?: string;
  targetAmount?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  merchant: string;
  category: TransactionCategory;
  date: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DailyQuote {
  id: string;
  text: string;
  author: string;
  category: 'motivation' | 'wisdom' | 'investment' | 'saving';
}

export interface LevelInfo {
  level: number;
  xpRequired: number;
  xpStart: number;
  xpEnd: number;
  title: string;
}

export interface DailyExpense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface WeeklyExpenseData {
  weekStart: string; // YYYY-MM-DD (Monday)
  expenses: DailyExpense[];
  total: number;
}

export interface MonthlyExpenseData {
  month: string; // YYYY-MM
  total: number;
  weeklyTotals: number[];
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  isPositive: boolean;
}

// Expense Splitter Types
export interface SharedGroup {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: string;
}

export interface SharedExpense {
  id: string;
  groupId: string;
  amount: number;
  description: string;
  paidBy: string;
  splitAmong: string[];
  category: string;
  date: string;
  timestamp: number;
}

export interface Balance {
  from: string;
  to: string;
  amount: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  from: string;
  to: string;
  amount: number;
  settledAt: string;
}

// Wishlist Tracker Types
export interface WishlistItem {
  id: string;
  name: string;
  url: string;
  category: string;
  targetPrice: number;
  currentPrice: number;
  lowestPrice: number;
  platform: string;
  priceHistory: PricePoint[];
  isPurchased: boolean;
  addedAt: string;
}

export interface PricePoint {
  date: string;
  price: number;
}

// Savings Goals Types
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  category: string;
  icon: string;
  createdAt: string;
  targetDate?: string;
}
