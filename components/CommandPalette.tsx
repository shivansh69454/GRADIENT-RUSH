'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Calculator,
  CornerDownLeft,
  FileImage,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Mailbox,
  MessageSquareText,
  Moon,
  PiggyBank,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
  Wallet,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { parseVoiceExpense } from '@/lib/voiceParser';
import { fuzzyScore, looksLikeExpense, stripAskPrefix } from '@/lib/palette';
import { detectEmoji } from '@/lib/categories';
import { emit } from '@/lib/bus';
import { cn, formatCurrency, getTodayDate } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ReactNode;
  /** Extra words that should match this command without being displayed. */
  keywords?: string;
  run: () => void;
}

const GROUP_ORDER = ['Quick add', 'Ask', 'Navigate', 'Actions', 'Goals'];

/**
 * ⌘K for money.
 *
 * Two jobs in one surface. It navigates like any command palette, but the same
 * input also logs an expense from plain language — "chai 40", "spent 250 on
 * uber" — because the fastest possible expense entry is the one that never
 * makes you leave the keyboard or find a form.
 */
export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { goals, saveGoals, logExpense, pushToast, budget } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  // ⌘K / Ctrl+K from anywhere, including inside inputs.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus after paint so the caret lands reliably on mobile too.
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previous;
      cancelAnimationFrame(id);
    };
  }, [open]);

  const go = useCallback(
    (href: string) => {
      router.push(href);
      close();
    },
    [router, close]
  );

  // ---------------------------------------------------------- quick add

  const draft = useMemo(() => {
    if (!looksLikeExpense(query)) return null;
    const parsed = parseVoiceExpense(query);
    if (!parsed.amount || parsed.amount <= 0) return null;
    return parsed;
  }, [query]);

  const askText = stripAskPrefix(query);

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      {
        id: 'nav-dashboard',
        label: 'Overview',
        hint: 'Dashboard',
        group: 'Navigate',
        icon: <LayoutDashboard className="h-4 w-4" />,
        keywords: 'home dashboard smartwise score budget',
        run: () => go('/dashboard'),
      },
      {
        id: 'nav-import',
        label: 'Import from SMS or a screenshot',
        group: 'Navigate',
        icon: <MessageSquareText className="h-4 w-4" />,
        keywords: 'sms upi parse screenshot statement ocr',
        run: () => go('/import-expense'),
      },
      {
        id: 'nav-split',
        label: 'Split & settle',
        group: 'Navigate',
        icon: <Users className="h-4 w-4" />,
        keywords: 'group friends qr whatsapp battle peer',
        run: () => go('/split'),
      },
      {
        id: 'nav-simulate',
        label: 'Simulate',
        hint: 'What-if, forecast, SIP, EMI',
        group: 'Navigate',
        icon: <Calculator className="h-4 w-4" />,
        keywords: 'forecast montecarlo probability sip emi whatif',
        run: () => go('/simulate'),
      },
      {
        id: 'nav-invest',
        label: 'Invest',
        hint: 'Learn mode',
        group: 'Navigate',
        icon: <LineChart className="h-4 w-4" />,
        keywords: 'stocks shares portfolio learn',
        run: () => go('/invest'),
      },
      {
        id: 'nav-future',
        label: 'Future self letter',
        group: 'Navigate',
        icon: <Mailbox className="h-4 w-4" />,
        keywords: 'letter ai ten years',
        run: () => go('/future'),
      },
      {
        id: 'nav-courses',
        label: 'Courses',
        group: 'Navigate',
        icon: <GraduationCap className="h-4 w-4" />,
        keywords: 'learn earn xp lessons quiz',
        run: () => go('/courses'),
      },
      {
        id: 'nav-mentor',
        label: 'AI mentor',
        group: 'Navigate',
        icon: <Bot className="h-4 w-4" />,
        keywords: 'chat ask gemini coach',
        run: () => go('/mentor'),
      },
      {
        id: 'act-report',
        label: 'Generate report card',
        hint: 'Shareable PNG',
        group: 'Actions',
        icon: <FileImage className="h-4 w-4" />,
        keywords: 'share png wrapped image export',
        run: () => {
          router.push('/dashboard');
          // Let the route settle before the panel listens for the event.
          setTimeout(() => emit('open-report'), 120);
          close();
        },
      },
      {
        id: 'act-survival',
        label: 'Start Survival Mode',
        hint: budget.status === 'over' ? 'You are over budget' : 'Rescue plan',
        group: 'Actions',
        icon: <LifeBuoy className="h-4 w-4" />,
        keywords: 'broke rescue emergency cap austerity panic',
        run: () => {
          router.push('/dashboard');
          setTimeout(() => emit('open-survival'), 120);
          close();
        },
      },
      {
        id: 'act-theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        group: 'Actions',
        icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        keywords: 'theme dark light appearance',
        run: () => {
          toggleTheme();
          close();
        },
      },
      {
        id: 'act-settings',
        label: 'Open settings',
        hint: 'Allowance, API key, demo data',
        group: 'Actions',
        icon: <Settings className="h-4 w-4" />,
        keywords: 'allowance api key reset demo profile',
        run: () => {
          emit('open-settings');
          close();
        },
      },
    ];

    goals.forEach((goal) => {
      base.push({
        id: `goal-${goal.id}`,
        label: `Add ₹100 to ${goal.name}`,
        hint: `${formatCurrency(goal.savedAmount)} of ${formatCurrency(goal.targetAmount)}`,
        group: 'Goals',
        icon: <PiggyBank className="h-4 w-4" />,
        keywords: `goal save contribute ${goal.name}`,
        run: () => {
          saveGoals(
            goals.map((g) =>
              g.id === goal.id
                ? {
                    ...g,
                    savedAmount: g.savedAmount + 100,
                    contributions: [
                      ...(g.contributions ?? []),
                      { date: getTodayDate(), amount: 100 },
                    ],
                  }
                : g
            )
          );
          pushToast({
            variant: 'success',
            icon: goal.icon,
            title: `₹100 into ${goal.name}`,
            description: `${formatCurrency(goal.savedAmount + 100)} saved so far.`,
          });
          close();
        },
      });
    });

    return base;
  }, [go, router, close, theme, toggleTheme, goals, saveGoals, pushToast, budget.status]);

  // ------------------------------------------------------------- ranking

  const results = useMemo<Command[]>(() => {
    const list: Command[] = [];

    if (draft) {
      const emoji = detectEmoji(draft.description, draft.category);
      list.push({
        id: 'quick-add',
        label: `Log ${formatCurrency(draft.amount ?? 0)} · ${draft.description || draft.category}`,
        hint: `${emoji} ${draft.category} · press Enter`,
        group: 'Quick add',
        icon: <Wallet className="h-4 w-4" />,
        run: () => {
          logExpense({
            amount: draft.amount ?? 0,
            description: draft.description || draft.category,
            category: draft.category,
            date: getTodayDate(),
            source: 'manual',
          });
          close();
        },
      });
    }

    if (askText !== null && askText.length > 0) {
      list.push({
        id: 'ask-mentor',
        label: `Ask the mentor: "${askText}"`,
        hint: 'Opens the AI coach with your question',
        group: 'Ask',
        icon: <Sparkles className="h-4 w-4" />,
        run: () => go(`/mentor?q=${encodeURIComponent(askText)}`),
      });
      return list;
    }

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      // A cold palette shows the useful defaults rather than everything.
      return [
        ...list,
        ...commands.filter((c) => c.group === 'Navigate').slice(0, 5),
        ...commands.filter((c) => c.group === 'Actions').slice(0, 3),
      ];
    }

    const scored = commands
      .map((command) => {
        const haystack = `${command.label} ${command.hint ?? ''} ${command.keywords ?? ''}`;
        const direct = fuzzyScore(trimmed, command.label);
        const wide = fuzzyScore(trimmed, haystack);
        const score = Math.max(direct ?? -Infinity, (wide ?? -Infinity) - 8);
        return { command, score };
      })
      .filter((entry) => entry.score > -Infinity)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((entry) => entry.command);

    return [...list, ...scored];
  }, [draft, askText, query, commands, logExpense, close, go]);

  useEffect(() => setActive(0), [query]);

  // Keep the highlighted row in view during keyboard navigation.
  useEffect(() => {
    const container = listRef.current;
    const row = container?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    row?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      results[active]?.run();
    }
  };

  if (!open) return null;

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: results
      .map((command, index) => ({ command, index }))
      .filter((entry) => entry.command.group === group),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] sm:pt-[15vh]">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-md" onClick={close} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="glass-strong relative z-10 w-full max-w-[560px] animate-scale-in overflow-hidden rounded-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-line/40 px-3.5">
          <Search className="h-4 w-4 shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command, or log an expense like “chai 40”"
            spellCheck={false}
            className="h-11 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <kbd className="hidden shrink-0 glass-subtle rounded-md px-1.5 py-0.5 text-2xs text-faint sm:block">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5 scrollbar-slim">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted">No matches</p>
              <p className="mt-1 text-2xs text-faint">
                Try “spent 200 on lunch” to log it, or start with <span className="text-muted">ask</span> to
                put the question to your mentor.
              </p>
            </div>
          ) : (
            grouped.map((section) => (
              <div key={section.group} className="pb-1">
                <p className="eyebrow px-3.5 pb-1 pt-1.5">{section.group}</p>
                {section.items.map(({ command, index }) => (
                  <button
                    key={command.id}
                    data-index={index}
                    onClick={command.run}
                    onMouseMove={() => setActive(index)}
                    className={cn(
                      'mx-1.5 flex w-[calc(100%-12px)] items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all duration-100',
                      index === active
                        ? 'bg-accent/12 ring-1 ring-accent/20'
                        : 'hover:bg-white/5'
                    )}
                  >
                    <span
                      className={cn(
                        'shrink-0',
                        index === active ? 'text-accent' : 'text-faint'
                      )}
                    >
                      {command.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{command.label}</span>
                      {command.hint && (
                        <span className="block truncate text-2xs text-faint">{command.hint}</span>
                      )}
                    </span>
                    {index === active && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-faint" />
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line/40 glass-subtle px-3.5 py-2">
          <div className="flex items-center gap-3 text-2xs text-faint">
            <span className="flex items-center gap-1">
              <kbd className="glass-subtle rounded-md px-1 py-0.5">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="glass-subtle rounded-md px-1 py-0.5">↵</kbd> run
            </span>
          </div>
          <p className="hidden text-2xs text-faint sm:block">
            {draft ? 'Recognised an expense' : 'Prefix with “ask” for the mentor'}
          </p>
        </div>
      </div>
    </div>
  );
};

/** Sidebar affordance so the shortcut is discoverable rather than folklore. */
export const CommandHint: React.FC<{ className?: string }> = ({ className }) => {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
  }, []);

  return (
    <button
      onClick={() =>
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
        )
      }
      className={cn(
        'glass flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5',
        'text-xs text-muted transition-all duration-150 hover:text-ink',
        className
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left font-medium">Search or log expense</span>
      <kbd className="glass-subtle shrink-0 rounded-md px-1.5 py-0.5 text-2xs text-faint">
        {isMac ? '⌘' : 'Ctrl'}K
      </kbd>
    </button>
  );
};
