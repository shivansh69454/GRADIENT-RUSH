'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  DailyExpense,
  Insight,
  Player,
  SavingsGoal,
  SmartwiseScoreResult,
  StreakState,
  Task,
  ToastItem,
  ToastVariant,
} from '@/types';
import * as store from '@/lib/storage';
import { EMPTY_PLAYER } from '@/lib/mockData';
import { buildDemoData } from '@/lib/demoData';
import {
  byCategory,
  expensesLastNDays,
  getBudgetState,
  type BudgetState,
  monthTotal,
} from '@/lib/analytics';
import { computeSmartwiseScore, trackScore, weakestPillar } from '@/lib/smartwiseScore';
import { generateInsights } from '@/lib/insights';
import { generateDailyTasks, mergeTaskState } from '@/lib/tasks';
import { markActive, resolveStreak, streakMultiplier } from '@/lib/streak';
import { levelUpConfetti } from '@/lib/celebrate';
import type { FinanceContext } from '@/lib/prompts';
import {
  calculateLevel,
  formatCurrency,
  getLevelTitle,
  getTodayDate,
  uid,
} from '@/lib/utils';

interface LevelUpPayload {
  level: number;
  title: string;
  previousTitle: string;
}

interface AppContextValue {
  ready: boolean;
  player: Player;
  expenses: DailyExpense[];
  goals: SavingsGoal[];
  tasks: Task[];
  streak: StreakState;
  budget: BudgetState;
  smartwiseScore: SmartwiseScoreResult;
  insights: Insight[];
  aiContext: FinanceContext;
  multiplier: number;

  updatePlayer: (patch: Partial<Player>) => void;
  awardXP: (amount: number, reason: string, options?: { silent?: boolean; anchor?: HTMLElement | null }) => void;
  logExpense: (input: Omit<DailyExpense, 'id' | 'timestamp'> & { timestamp?: number }) => DailyExpense;
  logExpenses: (inputs: (Omit<DailyExpense, 'id' | 'timestamp'> & { timestamp?: number })[]) => DailyExpense[];
  deleteExpense: (id: string) => void;
  saveGoals: (goals: SavingsGoal[]) => void;
  toggleTask: (taskId: string, anchor?: HTMLElement | null) => void;
  completeTaskByKey: (autoKey: string) => void;
  regenerateTasks: () => void;
  dismissInsight: (id: string) => void;

  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;

  levelUp: LevelUpPayload | null;
  clearLevelUp: () => void;

  seedDemoData: () => void;
  resetEverything: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [player, setPlayerState] = useState<Player>(EMPTY_PLAYER);
  const [expenses, setExpensesState] = useState<DailyExpense[]>([]);
  const [goals, setGoalsState] = useState<SavingsGoal[]>([]);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [streak, setStreakState] = useState<StreakState>({
    current: 0,
    best: 0,
    lastActiveDate: null,
    activeDates: [],
  });
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [scoreDelta, setScoreDelta] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [levelUp, setLevelUp] = useState<LevelUpPayload | null>(null);

  const scoreTrackedRef = useRef(false);

  // ---------------------------------------------------------------- hydrate

  useEffect(() => {
    try {
      const storedPlayer = store.getPlayer();
      const storedExpenses = store.getExpenses();
      const storedGoals = store.getGoals();
      const resolvedStreak = resolveStreak(store.getStreak());

      setPlayerState(storedPlayer ?? EMPTY_PLAYER);
      setExpensesState(storedExpenses);
      setGoalsState(storedGoals);
      setStreakState(resolvedStreak);
      setDismissed(store.getDismissedInsights());

      // Tasks are regenerated daily from live data rather than kept forever.
      const storedTasks = store.getTasks();
      const taskDate = store.read<string>(store.KEYS.taskDate, '');
      const today = getTodayDate();
      const fresh = generateDailyTasks({
        expenses: storedExpenses,
        goals: storedGoals,
        monthlyAllowance: storedPlayer?.monthly_allowance ?? 0,
        streak: resolvedStreak.current,
      });
      if (taskDate === today && storedTasks.length > 0) {
        setTasksState(mergeTaskState(fresh, storedTasks));
      } else {
        setTasksState(fresh);
        store.write(store.KEYS.taskDate, today);
        store.setTasks(fresh);
      }
    } catch (error) {
      // A corrupt localStorage entry should never brick the whole app.
      console.error('Smartwise failed to hydrate from storage:', error);
    } finally {
      setReady(true);
    }
  }, []);

  // ------------------------------------------------------------- derivations

  const budget = useMemo(
    () => getBudgetState(expenses, player.monthly_allowance),
    [expenses, player.monthly_allowance]
  );

  const smartwiseScoreBase = useMemo(
    () =>
      computeSmartwiseScore({
        expenses,
        goals,
        tasks,
        streak,
        monthlyAllowance: player.monthly_allowance,
      }),
    [expenses, goals, tasks, streak, player.monthly_allowance]
  );

  const smartwiseScore = useMemo<SmartwiseScoreResult>(
    () => ({ ...smartwiseScoreBase, delta: scoreDelta }),
    [smartwiseScoreBase, scoreDelta]
  );

  // Persist one score reading per day so the week-over-week delta is real.
  useEffect(() => {
    if (!ready || scoreTrackedRef.current) return;
    scoreTrackedRef.current = true;
    const { history, delta } = trackScore(smartwiseScoreBase.score, store.getScoreHistory());
    store.setScoreHistory(history);
    setScoreDelta(delta);
  }, [ready, smartwiseScoreBase.score]);

  const insights = useMemo(() => {
    const all = generateInsights({
      expenses,
      goals,
      streak,
      monthlyAllowance: player.monthly_allowance,
    });
    return all.filter((i) => !dismissed.includes(i.id));
  }, [expenses, goals, streak, player.monthly_allowance, dismissed]);

  const multiplier = useMemo(() => streakMultiplier(streak.current), [streak.current]);

  const aiContext = useMemo<FinanceContext>(() => {
    const recent = expensesLastNDays(expenses, 30);
    const categories = byCategory(recent).slice(0, 3);
    const biggest = [...recent].sort((a, b) => b.amount - a.amount)[0];
    const months = new Set(expenses.map((e) => e.date?.slice(0, 7))).size;

    return {
      name: player.name,
      age: player.age,
      level: player.level,
      title: getLevelTitle(player.level),
      monthlyAllowance: player.monthly_allowance,
      spentThisMonth: monthTotal(expenses),
      remaining: budget.remaining,
      safeDailyAllowance: budget.safeDailyAllowance,
      daysLeft: budget.daysLeft,
      smartwiseScore: smartwiseScoreBase.score,
      smartwiseScoreGrade: smartwiseScoreBase.grade,
      weakestPillar: weakestPillar(smartwiseScoreBase).label,
      topCategories: categories.map((c) => ({
        category: c.category,
        total: c.total,
        share: c.share,
      })),
      goals: goals.map((g) => ({ name: g.name, target: g.targetAmount, saved: g.savedAmount })),
      streak: streak.current,
      expenseCount: expenses.length,
      biggestExpense: biggest
        ? { description: biggest.description || biggest.category, amount: biggest.amount }
        : undefined,
      monthsTracked: months,
    };
  }, [player, expenses, goals, streak.current, budget, smartwiseScoreBase]);

  // ------------------------------------------------------------------ toasts

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = uid('toast');
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      const ttl = toast.variant === 'danger' ? 6000 : 4200;
      setTimeout(() => dismissToast(id), ttl);
    },
    [dismissToast]
  );

  // -------------------------------------------------------------- player / XP

  const updatePlayer = useCallback((patch: Partial<Player>) => {
    setPlayerState((prev) => {
      const next = { ...prev, ...patch };
      next.level = calculateLevel(next.total_xp_earned);
      next.xp_points = next.total_xp_earned % 1000;
      store.setPlayer(next);
      return next;
    });
  }, []);

  const awardXP = useCallback(
    (amount: number, reason: string, options?: { silent?: boolean; anchor?: HTMLElement | null }) => {
      if (amount === 0) return;

      // Streak multipliers only ever boost gains, never penalties.
      const boosted = amount > 0 ? Math.round(amount * streakMultiplier(streak.current)) : amount;

      setPlayerState((prev) => {
        const totalXP = Math.max(0, prev.total_xp_earned + boosted);
        const nextLevel = calculateLevel(totalXP);
        const next: Player = {
          ...prev,
          total_xp_earned: totalXP,
          xp_points: totalXP % 1000,
          level: nextLevel,
        };
        store.setPlayer(next);

        if (nextLevel > prev.level) {
          setLevelUp({
            level: nextLevel,
            title: getLevelTitle(nextLevel),
            previousTitle: getLevelTitle(prev.level),
          });
          void levelUpConfetti();
        }
        return next;
      });

      if (!options?.silent) {
        const mult = streakMultiplier(streak.current);
        pushToast({
          variant: boosted > 0 ? 'xp' : 'warning',
          title: `${boosted > 0 ? '+' : ''}${boosted} XP`,
          description: mult > 1 && boosted > 0 ? `${reason} · ${mult}× streak bonus` : reason,
        });
      }
    },
    [pushToast, streak.current]
  );

  // ----------------------------------------------------------------- streaks

  const touchStreak = useCallback(() => {
    setStreakState((prev) => {
      const next = markActive(prev);
      if (next === prev) return prev;
      store.setStreak(next);
      if (next.current > prev.current && next.current >= 3) {
        const mult = streakMultiplier(next.current);
        if (mult > streakMultiplier(prev.current)) {
          pushToast({
            variant: 'success',
            icon: '🔥',
            title: `${next.current}-day streak`,
            description: `XP multiplier is now ${mult}×`,
          });
        }
      }
      return next;
    });
  }, [pushToast]);

  // ---------------------------------------------------------------- expenses

  const persistExpenses = useCallback((next: DailyExpense[]) => {
    setExpensesState(next);
    store.setExpenses(next);
  }, []);

  /** The "conscience" nudge — instant feedback on what a purchase really cost. */
  const conscienceToast = useCallback(
    (expense: DailyExpense, allExpenses: DailyExpense[]) => {
      const state = getBudgetState(allExpenses, player.monthly_allowance);
      if (player.monthly_allowance <= 0) return;

      const shareOfDay = state.todayBudget > 0 ? expense.amount / state.todayBudget : 0;

      if (state.todaySpend > state.todayBudget) {
        pushToast({
          variant: 'danger',
          icon: '🚨',
          title: `${formatCurrency(state.todaySpend - state.todayBudget)} over today's budget`,
          description: `${formatCurrency(state.remaining)} left for ${state.daysLeft} days. Skip the next one.`,
        });
      } else if (shareOfDay >= 0.35) {
        pushToast({
          variant: 'warning',
          icon: '⚠️',
          title: `That was ${Math.round(shareOfDay * 100)}% of today's budget`,
          description: `${formatCurrency(state.todayBudget - state.todaySpend)} left for the rest of today.`,
        });
      } else {
        pushToast({
          variant: 'info',
          icon: '✓',
          title: `${formatCurrency(expense.amount)} logged`,
          description: `${Math.round(shareOfDay * 100)}% of today's limit · ${formatCurrency(
            state.todayBudget - state.todaySpend
          )} still safe`,
        });
      }
    },
    [player.monthly_allowance, pushToast]
  );

  const completeTaskByKey = useCallback(
    (autoKey: string) => {
      setTasksState((prev) => {
        const target = prev.find((t) => t.autoKey === autoKey && !t.completed);
        if (!target) return prev;
        const next = prev.map((t) => (t.id === target.id ? { ...t, completed: true } : t));
        store.setTasks(next);
        // Defer so we do not award XP during another component's render pass.
        setTimeout(() => awardXP(target.xp_reward, `Auto-completed: ${target.title}`), 400);
        return next;
      });
    },
    [awardXP]
  );

  const logExpense = useCallback(
    (input: Omit<DailyExpense, 'id' | 'timestamp'> & { timestamp?: number }) => {
      const expense: DailyExpense = {
        ...input,
        id: uid('exp'),
        timestamp: input.timestamp ?? Date.now(),
      };
      const next = [expense, ...expenses];
      persistExpenses(next);
      touchStreak();
      conscienceToast(expense, next);

      const loggedToday = next.filter((e) => e.date === getTodayDate()).length;
      completeTaskByKey('log-expense');
      if (loggedToday >= 3) completeTaskByKey('log-three');

      return expense;
    },
    [expenses, persistExpenses, touchStreak, conscienceToast, completeTaskByKey]
  );

  const logExpenses = useCallback(
    (inputs: (Omit<DailyExpense, 'id' | 'timestamp'> & { timestamp?: number })[]) => {
      if (inputs.length === 0) return [];
      const created = inputs.map((input) => ({
        ...input,
        id: uid('exp'),
        timestamp: input.timestamp ?? Date.now(),
      }));
      const next = [...created, ...expenses];
      persistExpenses(next);
      touchStreak();
      completeTaskByKey('log-expense');
      if (next.filter((e) => e.date === getTodayDate()).length >= 3) completeTaskByKey('log-three');
      return created;
    },
    [expenses, persistExpenses, touchStreak, completeTaskByKey]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      persistExpenses(expenses.filter((e) => e.id !== id));
    },
    [expenses, persistExpenses]
  );

  // -------------------------------------------------------------------- goals

  const saveGoals = useCallback(
    (next: SavingsGoal[]) => {
      setGoalsState(next);
      store.setGoals(next);
      if (next.length > 0) completeTaskByKey('create-goal');
    },
    [completeTaskByKey]
  );

  // -------------------------------------------------------------------- tasks

  const toggleTask = useCallback(
    (taskId: string, anchor?: HTMLElement | null) => {
      setTasksState((prev) => {
        const target = prev.find((t) => t.id === taskId);
        if (!target) return prev;
        const next = prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
        store.setTasks(next);

        const nowComplete = !target.completed;
        setTimeout(() => {
          awardXP(nowComplete ? target.xp_reward : -target.xp_reward, target.title, {
            anchor,
          });
        }, 0);
        if (nowComplete) touchStreak();
        return next;
      });
    },
    [awardXP, touchStreak]
  );

  const regenerateTasks = useCallback(() => {
    const fresh = generateDailyTasks({
      expenses,
      goals,
      monthlyAllowance: player.monthly_allowance,
      streak: streak.current,
    });
    const merged = mergeTaskState(fresh, tasks);
    setTasksState(merged);
    store.setTasks(merged);
    store.write(store.KEYS.taskDate, getTodayDate());
  }, [expenses, goals, player.monthly_allowance, streak.current, tasks]);

  const dismissInsight = useCallback(
    (id: string) => {
      const next = [...dismissed, id];
      setDismissed(next);
      store.setDismissedInsights(next);
    },
    [dismissed]
  );

  /**
   * Fills the app with three months of believable history.
   *
   * The pattern-finding features — subscription radar, forecast volatility,
   * the heatmap — have nothing to say on an empty ledger, and asking anyone to
   * hand-log ninety days before seeing them work is absurd.
   */
  const seedDemoData = useCallback(() => {
    const allowance = player.monthly_allowance > 0 ? player.monthly_allowance : 15000;
    const seed = buildDemoData(allowance);

    persistExpenses(seed.expenses);
    setGoalsState(seed.goals);
    store.setGoals(seed.goals);

    const bestRun = seed.activeDates.length;
    const seededStreak: StreakState = {
      current: 9,
      best: Math.max(9, Math.min(bestRun, 21)),
      lastActiveDate: getTodayDate(),
      activeDates: seed.activeDates,
    };
    setStreakState(seededStreak);
    store.setStreak(seededStreak);

    // A believable level to match a believable history.
    updatePlayer({ monthly_allowance: allowance, total_xp_earned: 4350 });

    pushToast({
      variant: 'success',
      icon: '🌱',
      title: 'Demo history loaded',
      description: `${seed.expenses.length} expenses across 3 months, plus goals and a streak.`,
    });
  }, [player.monthly_allowance, persistExpenses, updatePlayer, pushToast]);

  const resetEverything = useCallback(() => {
    store.resetAll();
    window.location.href = '/onboarding';
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      player,
      expenses,
      goals,
      tasks,
      streak,
      budget,
      smartwiseScore,
      insights,
      aiContext,
      multiplier,
      updatePlayer,
      awardXP,
      logExpense,
      logExpenses,
      deleteExpense,
      saveGoals,
      toggleTask,
      completeTaskByKey,
      regenerateTasks,
      dismissInsight,
      toasts,
      pushToast,
      dismissToast,
      levelUp,
      clearLevelUp: () => setLevelUp(null),
      seedDemoData,
      resetEverything,
    }),
    [
      ready, player, expenses, goals, tasks, streak, budget, smartwiseScore, insights, aiContext,
      multiplier, updatePlayer, awardXP, logExpense, logExpenses, deleteExpense, saveGoals,
      toggleTask, completeTaskByKey, regenerateTasks, dismissInsight, toasts, pushToast,
      dismissToast, levelUp, seedDemoData, resetEverything,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export type { ToastVariant };
