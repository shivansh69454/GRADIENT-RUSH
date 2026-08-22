'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FileImage, Flame, Sparkles } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { AnimatedNumber, ProgressBar } from '@/components/ui/Charts';
import { SmartwiseScoreCard } from '@/components/SmartwiseScoreCard';
import { BudgetGuardian } from '@/components/BudgetGuardian';
import { NudgeInsights } from '@/components/NudgeInsights';
import { TaskPanel } from '@/components/TaskPanel';
import { ExpenseTracker } from '@/components/ExpenseTracker';
import { SpendingTrend } from '@/components/SpendingTrend';
import { SpendingHeatmap } from '@/components/SpendingHeatmap';
import { StreakTracker } from '@/components/StreakTracker';
import { SavingsGoals } from '@/components/SavingsGoals';
import { WishlistTracker } from '@/components/WishlistTracker';
import { ReportCard } from '@/components/ReportCard';
import { QuotePanel } from '@/components/QuotePanel';
import { SubscriptionRadar } from '@/components/SubscriptionRadar';
import { SurvivalMode } from '@/components/SurvivalMode';
import { useApp } from '@/contexts/AppContext';
import { onCommand } from '@/lib/bus';
import { cn, getCurrentLevelXP, getLevelTitle, XP_PER_LEVEL } from '@/lib/utils';

const HeroStrip: React.FC = () => {
  const { player, streak, multiplier, smartwiseScore } = useApp();
  const levelXP = getCurrentLevelXP(player.total_xp_earned);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="panel overflow-hidden">
      <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        {/* Soft accent wash behind the hero numbers */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 85% 50%, rgb(var(--accent) / 0.08), transparent 70%)',
          }}
        />

        <div className="relative min-w-0">
          <p className="eyebrow">{greeting}</p>
          <h2 className="mt-0.5 truncate text-xl font-semibold text-ink">
            {player.name || 'Welcome back'}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Level {player.level} · {getLevelTitle(player.level)}
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4 sm:gap-6">
          <div>
            <p className="eyebrow">Score</p>
            <p
              className={cn(
                'text-2xl font-semibold tabnum',
                smartwiseScore.band === 'positive' && 'text-positive',
                smartwiseScore.band === 'warning' && 'text-warning',
                smartwiseScore.band === 'negative' && 'text-negative'
              )}
            >
              <AnimatedNumber value={smartwiseScore.score} />
            </p>
          </div>
          <div>
            <p className="eyebrow">Streak</p>
            <p className="flex items-baseline gap-1 text-2xl font-semibold tabnum text-ink">
              {streak.current}
              {multiplier > 1 && (
                <span className="text-xs font-medium text-accent">{multiplier}×</span>
              )}
            </p>
          </div>
          <div className="min-w-[92px]">
            <p className="eyebrow">Level {player.level}</p>
            <p className="text-2xl font-semibold tabnum text-ink">
              <AnimatedNumber value={player.total_xp_earned} />
              <span className="ml-0.5 text-xs font-medium text-faint">XP</span>
            </p>
            <ProgressBar value={levelXP} max={XP_PER_LEVEL} height={3} className="mt-1.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [reportOpen, setReportOpen] = useState(false);
  const { streak } = useApp();

  const openReport = useCallback(() => setReportOpen(true), []);
  useEffect(() => onCommand('open-report', openReport), [openReport]);

  return (
    <>
      <PageHeader
        title="Overview"
        description="Everything about your money in one place"
        action={
          <>
            {streak.current >= 3 && (
              <span className="chip chip-warning hidden sm:inline-flex">
                <Flame className="h-3 w-3" />
                {streak.current} days
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReportOpen(true)}
              icon={<FileImage className="h-3.5 w-3.5" />}
            >
              <span className="hidden sm:inline">Report card</span>
            </Button>
          </>
        }
      />

      <PageBody className="space-y-4">
        <HeroStrip />
        <QuotePanel />

        {/* Row 1 — the numbers that matter */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <SmartwiseScoreCard />
          <BudgetGuardian />
        </div>

        {/* Row 2 — daily loop */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <TaskPanel />
          <ExpenseTracker />
          <div className="space-y-4 lg:col-span-2 xl:col-span-1">
            <NudgeInsights />
          </div>
        </div>

        {/* Row 3 — behaviour */}
        <div className="grid gap-4 lg:grid-cols-2">
          <SpendingTrend />
          <SpendingHeatmap />
        </div>

        {/* Row 4 — the money you are not watching */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <SubscriptionRadar />
          <SurvivalMode />
        </div>

        {/* Row 5 — habit & goals */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <StreakTracker />
          <SavingsGoals />
          <div className="lg:col-span-2 xl:col-span-1">
            <WishlistTracker />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 pb-6">
          <Sparkles className="h-3 w-3 text-faint" />
          <p className="text-2xs text-faint">
            Every number here is computed from what you logged. Nothing is simulated.
          </p>
        </div>
      </PageBody>

      <ReportCard open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}
