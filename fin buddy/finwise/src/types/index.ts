export interface DailyExpense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  timestamp: number;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  isPositive: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  category: string;
  icon: string;
  createdAt: string;
}

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