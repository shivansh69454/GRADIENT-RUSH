'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Calculator,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Mailbox,
  Menu,
  MessageSquareText,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SettingsModal } from '@/components/SettingsModal';
import { CommandHint } from '@/components/CommandPalette';
import { IconButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Charts';
import { onCommand } from '@/lib/bus';
import { cn, getCurrentLevelXP, getLevelTitle, XP_PER_LEVEL } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: '/import-expense', label: 'Import SMS', icon: <MessageSquareText className="h-4 w-4" /> },
      { href: '/split', label: 'Split & settle', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/simulate', label: 'Simulate', icon: <Calculator className="h-4 w-4" /> },
      { href: '/invest', label: 'Invest', icon: <LineChart className="h-4 w-4" />, badge: 'Learn' },
      { href: '/future', label: 'Future self', icon: <Mailbox className="h-4 w-4" />, badge: 'AI' },
    ],
  },
  {
    title: 'Learn',
    items: [
      { href: '/courses', label: 'Courses', icon: <GraduationCap className="h-4 w-4" /> },
      { href: '/mentor', label: 'AI mentor', icon: <Bot className="h-4 w-4" /> },
    ],
  },
];

const Logo: React.FC = () => (
  <Link href="/dashboard" className="group flex items-center gap-2.5">
    <span
      className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[13px] font-bold text-white shadow-glow transition-transform duration-200 group-hover:scale-105"
      style={{
        boxShadow: '0 2px 12px rgb(var(--accent) / 0.4), inset 0 1px 0 rgb(255 255 255 / 0.2)',
      }}
    >
      ₹
    </span>
    <span className="text-[15px] font-semibold tracking-tight text-ink">Smartwise</span>
  </Link>
);

const LevelRail: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { player, streak, multiplier, smartwiseScore } = useApp();
  const levelXP = getCurrentLevelXP(player.total_xp_earned);

  return (
    <div className="space-y-2.5 border-t border-line/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink">
            {player.name || 'Your account'}
          </p>
          <p className="truncate text-2xs text-faint">
            Level {player.level} · {getLevelTitle(player.level)}
          </p>
        </div>
        <IconButton label="Settings" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="space-y-1">
        <ProgressBar value={levelXP} max={XP_PER_LEVEL} height={4} />
        <div className="flex items-center justify-between text-2xs text-faint">
          <span className="tabnum">
            {levelXP} / {XP_PER_LEVEL} XP
          </span>
          <span className="tabnum">Score {smartwiseScore.score}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'chip flex-1 justify-center',
            streak.current > 0 ? 'chip-warning' : ''
          )}
        >
          <Flame className="h-3 w-3" />
          {streak.current}d streak
        </span>
        {multiplier > 1 && (
          <span className="chip chip-accent justify-center">
            <Sparkles className="h-3 w-3" />
            {multiplier}× XP
          </span>
        )}
      </div>
    </div>
  );
};

const NavList: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto p-3 scrollbar-slim">
      <CommandHint />
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-0.5">
          <p className="eyebrow px-2.5 pb-1">{section.title}</p>
          {section.items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn('nav-item', active && 'nav-item-active')}
              >
                <span className={active ? 'text-accent' : 'text-faint'}>{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && <span className="chip chip-accent">{item.badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMobileOpen(false), [pathname]);

  // The command palette lives outside this tree but can still open settings.
  useEffect(() => onCommand('open-settings', () => setSettingsOpen(true)), []);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className="glass-strong sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-line/40 lg:flex"
      >
        <div className="flex h-14 items-center px-4">
          <Logo />
        </div>
        <NavList />
        <LevelRail onOpenSettings={() => setSettingsOpen(true)} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="glass-strong relative z-10 flex h-full w-[280px] animate-slide-in-right flex-col border-r border-line/40"
          >
            <div className="flex h-14 items-center justify-between px-4">
              <Logo />
              <IconButton label="Close menu" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
            <LevelRail onOpenSettings={() => setSettingsOpen(true)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header
          className="glass-bar sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b px-4 lg:hidden"
        >
          <div className="flex items-center gap-2">
            <IconButton label="Open menu" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
            </IconButton>
            <Logo />
          </div>
          <ThemeToggle />
        </header>

        <main className="min-w-0 flex-1 safe-bottom">{children}</main>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

/** Consistent page header used by every route. */
export const PageHeader: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}> = ({ title, description, action, eyebrow }) => (
  <div className="glass-bar sticky top-0 z-30 border-b">
    <div className="mx-auto flex max-w-[1400px] items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:h-14 lg:items-center lg:py-0">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="truncate text-base font-semibold text-ink">{title}</h1>
        {description && <p className="mt-0.5 truncate text-xs text-muted lg:hidden">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {description && <p className="hidden text-xs text-muted xl:block">{description}</p>}
        {action}
        <span className="hidden lg:block">
          <ThemeToggle />
        </span>
      </div>
    </div>
  </div>
);

export const PageBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 animate-fade-up', className)}>
    {children}
  </div>
);
