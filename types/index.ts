// Type definitions for Smartwise

export type ThemePreference = 'light' | 'dark';

export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'boss';

export type TaskCategory = 'saving' | 'learning' | 'budgeting' | 'investment' | 'discipline';

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills'
  | 'Education'
  | 'Health'
  | 'Groceries'
  | 'Rent'
  | 'Other';

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
  /** Task is generated from the user's own data rather than a static template. */
  personalized?: boolean;
  targetAmount?: number;
  autoKey?: string;
}

export interface DailyExpense {
  id: string;
  amount: number;
  description: string;
  category: ExpenseCategory | string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  /** Where the entry came from — powers the "how you logged" breakdown. */
  source?: 'manual' | 'voice' | 'sms' | 'scan' | 'split';
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  category: string;
  icon: string;
  createdAt: string;
  targetDate?: string;
  /** Monthly contribution the user is committing to, used for ETA maths. */
  monthlyContribution?: number;
  contributions?: { date: string; amount: number }[];
}

export interface LevelInfo {
  level: number;
  xpRequired: number;
  xpStart: number;
  xpEnd: number;
  title: string;
}

// ---------- Gamification ----------

export interface StreakState {
  current: number;
  best: number;
  lastActiveDate: string | null;
  activeDates: string[];
}

export interface XPEvent {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

export type ToastVariant = 'xp' | 'success' | 'warning' | 'danger' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  icon?: string;
}

// ---------- Smartwise Score ----------

export interface SmartwiseScorePillar {
  key: 'savings' | 'budget' | 'tasks' | 'goals' | 'consistency';
  label: string;
  /** 0-1 normalised performance. */
  ratio: number;
  weight: number;
  points: number;
  detail: string;
}

export interface SmartwiseScoreResult {
  score: number;
  grade: 'Critical' | 'Fragile' | 'Stable' | 'Strong' | 'Elite';
  band: 'negative' | 'warning' | 'positive';
  pillars: SmartwiseScorePillar[];
  delta: number;
  hasEnoughData: boolean;
}

// ---------- Insights (Nudge engine) ----------

export type InsightTone = 'positive' | 'warning' | 'danger' | 'neutral';

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: string;
  title: string;
  body: string;
  /** Optional concrete action, e.g. "Save ₹1,200/mo". */
  action?: string;
}

// ---------- SMS / UPI parsing ----------

export type TokenKind = 'amount' | 'merchant' | 'category' | 'account' | 'date' | 'ref' | 'plain';

export interface ParsedToken {
  text: string;
  kind: TokenKind;
}

export interface ParsedTransaction {
  id: string;
  raw: string;
  tokens: ParsedToken[];
  amount: number | null;
  merchant: string | null;
  category: ExpenseCategory;
  direction: 'debit' | 'credit';
  accountHint: string | null;
  date: string;
  confidence: number;
}

// ---------- Expense splitting ----------

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

// ---------- Stocks (learning mode) ----------

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  /** Reference price used for the virtual portfolio — no fake ticking. */
  referencePrice: number;
  yearReturnPct: number;
  lesson: string;
  concept: string;
  conceptExplainer: string;
}

export interface PortfolioHolding {
  symbol: string;
  units: number;
  avgPrice: number;
  investedAt: string;
}

export interface VirtualPortfolio {
  cash: number;
  holdings: PortfolioHolding[];
  studied: string[];
}

// ---------- Peer battle ----------

export interface PeerBattle {
  code: string;
  createdAt: string;
  weekStart: string;
  you: { name: string; saved: number; logged: number };
  rival: { name: string; saved: number; logged: number };
  status: 'active' | 'won' | 'lost' | 'tied';
}

// ---------- Wishlist ----------

export interface WishlistItem {
  id: string;
  name: string;
  category: string;
  targetPrice: number;
  currentPrice: number;
  platform: string;
  isPurchased: boolean;
  addedAt: string;
}

// ---------- Statement screenshot import ----------

export interface StatementRow {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  direction: 'debit' | 'credit';
  confidence: number;
  /** The OCR line(s) this row was reconstructed from, shown for verification. */
  raw: string;
}

// ---------- Subscription radar ----------

export type SubscriptionCadence = 'weekly' | 'monthly' | 'quarterly';

export interface Subscription {
  id: string;
  merchant: string;
  category: ExpenseCategory;
  emoji: string;
  cadence: SubscriptionCadence;
  /** Typical charge, median across occurrences. */
  amount: number;
  occurrences: number;
  firstDate: string;
  lastDate: string;
  nextDate: string;
  monthlyCost: number;
  annualCost: number;
  confidence: number;
  /** Set when later charges cost more than the first — a real, quiet price hike. */
  priceCreep?: { from: number; to: number };
}

// ---------- Monte Carlo forecast ----------

export interface ForecastBand {
  month: number;
  p10: number;
  p50: number;
  p90: number;
}

export interface ForecastResult {
  runs: number;
  /** Share of simulated futures that reach the target within the horizon. */
  probability: number;
  bands: ForecastBand[];
  /** Median month the target is hit, or null when most runs never get there. */
  medianMonth: number | null;
  finalP10: number;
  finalP50: number;
  finalP90: number;
  hasEnoughData: boolean;
}

// ---------- Survival mode ----------

export interface SurvivalCut {
  category: string;
  emoji: string;
  currentDaily: number;
  cappedDaily: number;
  dailySaving: number;
}

export interface SurvivalPlan {
  startDate: string;
  endDate: string;
  days: number;
  dailyCap: number;
  totalCap: number;
  /** Baseline daily burn the plan is cutting down from. */
  baselineDaily: number;
  cuts: SurvivalCut[];
  swaps: string[];
  reason: string;
}

export interface SurvivalDay {
  date: string;
  spent: number;
  cap: number;
  status: 'survived' | 'broken' | 'today' | 'upcoming';
}

export interface SurvivalState {
  active: boolean;
  plan: SurvivalPlan | null;
  startedAt: string | null;
  /** Dates already rewarded, so XP is never double-paid on re-render. */
  rewardedDates: string[];
}

// ---------- Chat ----------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** True when the reply came from the live model rather than the offline fallback. */
  live?: boolean;
}

export interface DailyQuote {
  id: string;
  text: string;
  author: string;
}
