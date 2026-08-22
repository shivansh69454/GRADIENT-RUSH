/**
 * Single source of truth for every localStorage read/write in Smartwise.
 *
 * Before this existed, five components wrote three different shapes to
 * overlapping keys (`monthly_2025-10` vs `monthly_October 2025`), so totals
 * silently disagreed between panels. Everything now derives from the one
 * canonical expense list and notifies subscribers on write.
 */

import type {
  DailyExpense,
  PeerBattle,
  Player,
  SavingsGoal,
  SharedExpense,
  SharedGroup,
  Settlement,
  StreakState,
  SurvivalState,
  Task,
  VirtualPortfolio,
  WishlistItem,
  ChatMessage,
} from '@/types';

export const KEY_PREFIX = 'smartwise';

/** The prefix used before the rename, kept only so old data can be carried over. */
const LEGACY_KEY_PREFIX = 'finwise';

export const KEYS = {
  player: 'smartwise_player',
  expenses: 'smartwise_expenses',
  tasks: 'smartwise_tasks',
  taskDate: 'smartwise_task_date',
  goals: 'smartwise_goals',
  streak: 'smartwise_streak',
  groups: 'smartwise_groups',
  groupExpenses: 'smartwise_group_expenses',
  settlements: 'smartwise_settlements',
  wishlist: 'smartwise_wishlist',
  portfolio: 'smartwise_portfolio',
  chat: 'smartwise_chat',
  battle: 'smartwise_battle',
  scoreHistory: 'smartwise_score_history',
  dismissedInsights: 'smartwise_dismissed_insights',
  letters: 'smartwise_letters',
  completedCourses: 'smartwise_completed_courses',
  keptSubscriptions: 'smartwise_kept_subscriptions',
  survival: 'smartwise_survival',
  apiKey: 'smartwise_gemini_key',
  theme: 'theme',
} as const;

export const STORE_EVENT = 'smartwise:store';

const isBrowser = () => typeof window !== 'undefined';

/**
 * Carries data written under the old key prefix across to the new one.
 *
 * Renaming the prefix would otherwise look exactly like a factory reset to
 * anyone who had already used the app: the data is still sitting in
 * localStorage, just under names nothing reads any more. This runs once on
 * import, before any consumer gets a chance to read, and works off the prefix
 * rather than the KEYS list so that keys owned by individual components are
 * migrated too.
 */
const migrateLegacyKeys = (): void => {
  if (!isBrowser()) return;
  try {
    const legacy = Object.keys(window.localStorage).filter((key) =>
      key.startsWith(LEGACY_KEY_PREFIX)
    );
    legacy.forEach((oldKey) => {
      const newKey = `${KEY_PREFIX}${oldKey.slice(LEGACY_KEY_PREFIX.length)}`;
      // Never overwrite data already written under the new name.
      if (window.localStorage.getItem(newKey) === null) {
        const value = window.localStorage.getItem(oldKey);
        if (value !== null) window.localStorage.setItem(newKey, value);
      }
      window.localStorage.removeItem(oldKey);
    });
  } catch {
    /* private mode or quota — the app still works, just without the old data */
  }
};

migrateLegacyKeys();

export function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key } }));
  } catch {
    /* quota exceeded or private mode — degrade silently */
  }
}

export function remove(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key } }));
}

/** Subscribe to any store mutation. Returns an unsubscribe function. */
export function subscribe(listener: (key: string) => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ key: string }>).detail;
    listener(detail?.key ?? '');
  };
  window.addEventListener(STORE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(STORE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

// ---------------------------------------------------------------- entities

export const getPlayer = (): Player | null => read<Player | null>(KEYS.player, null);
export const setPlayer = (player: Player) => write(KEYS.player, player);

export const getExpenses = (): DailyExpense[] => {
  const list = read<DailyExpense[]>(KEYS.expenses, []);
  return Array.isArray(list) ? list : [];
};
export const setExpenses = (expenses: DailyExpense[]) => write(KEYS.expenses, expenses);

export const addExpense = (expense: DailyExpense): DailyExpense[] => {
  const next = [expense, ...getExpenses()];
  setExpenses(next);
  return next;
};

export const addExpenses = (expenses: DailyExpense[]): DailyExpense[] => {
  const next = [...expenses, ...getExpenses()];
  setExpenses(next);
  return next;
};

export const removeExpense = (id: string): DailyExpense[] => {
  const next = getExpenses().filter((e) => e.id !== id);
  setExpenses(next);
  return next;
};

export const getTasks = (): Task[] => read<Task[]>(KEYS.tasks, []);
export const setTasks = (tasks: Task[]) => write(KEYS.tasks, tasks);

export const getGoals = (): SavingsGoal[] => read<SavingsGoal[]>(KEYS.goals, []);
export const setGoals = (goals: SavingsGoal[]) => write(KEYS.goals, goals);

export const getStreak = (): StreakState =>
  read<StreakState>(KEYS.streak, { current: 0, best: 0, lastActiveDate: null, activeDates: [] });
export const setStreak = (streak: StreakState) => write(KEYS.streak, streak);

export const getGroups = (): SharedGroup[] => read<SharedGroup[]>(KEYS.groups, []);
export const setGroups = (groups: SharedGroup[]) => write(KEYS.groups, groups);

export const getGroupExpenses = (): SharedExpense[] =>
  read<SharedExpense[]>(KEYS.groupExpenses, []);
export const setGroupExpenses = (list: SharedExpense[]) => write(KEYS.groupExpenses, list);

export const getSettlements = (): Settlement[] => read<Settlement[]>(KEYS.settlements, []);
export const setSettlements = (list: Settlement[]) => write(KEYS.settlements, list);

export const getWishlist = (): WishlistItem[] => read<WishlistItem[]>(KEYS.wishlist, []);
export const setWishlist = (list: WishlistItem[]) => write(KEYS.wishlist, list);

export const getPortfolio = (): VirtualPortfolio =>
  read<VirtualPortfolio>(KEYS.portfolio, { cash: 10000, holdings: [], studied: [] });
export const setPortfolio = (p: VirtualPortfolio) => write(KEYS.portfolio, p);

export const getChat = (): ChatMessage[] => read<ChatMessage[]>(KEYS.chat, []);
export const setChat = (messages: ChatMessage[]) => write(KEYS.chat, messages);

export const getBattle = (): PeerBattle | null => read<PeerBattle | null>(KEYS.battle, null);
export const setBattle = (battle: PeerBattle | null) => write(KEYS.battle, battle);

export const getScoreHistory = (): { date: string; score: number }[] =>
  read<{ date: string; score: number }[]>(KEYS.scoreHistory, []);
export const setScoreHistory = (history: { date: string; score: number }[]) =>
  write(KEYS.scoreHistory, history);

export const getDismissedInsights = (): string[] => read<string[]>(KEYS.dismissedInsights, []);
export const setDismissedInsights = (ids: string[]) => write(KEYS.dismissedInsights, ids);

export const getApiKey = (): string => read<string>(KEYS.apiKey, '');
export const setApiKey = (key: string) => write(KEYS.apiKey, key);

export const getCompletedCourses = (): string[] => read<string[]>(KEYS.completedCourses, []);
export const setCompletedCourses = (ids: string[]) => write(KEYS.completedCourses, ids);

/** Subscriptions the user explicitly decided to keep, so the radar stops nagging. */
export const getKeptSubscriptions = (): string[] => read<string[]>(KEYS.keptSubscriptions, []);
export const setKeptSubscriptions = (ids: string[]) => write(KEYS.keptSubscriptions, ids);

export const IDLE_SURVIVAL: SurvivalState = {
  active: false,
  plan: null,
  startedAt: null,
  rewardedDates: [],
};

export const getSurvival = (): SurvivalState => read<SurvivalState>(KEYS.survival, IDLE_SURVIVAL);
export const setSurvival = (state: SurvivalState) => write(KEYS.survival, state);

/** Wipes every Smartwise key. Used by the reset control in settings. */
export const resetAll = () => {
  if (!isBrowser()) return;
  Object.keys(window.localStorage)
    // The legacy prefix is included so a reset cannot leave stale data behind.
    .filter((k) => k.startsWith(KEY_PREFIX) || k.startsWith(LEGACY_KEY_PREFIX))
    .forEach((k) => window.localStorage.removeItem(k));
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key: '*' } }));
};
