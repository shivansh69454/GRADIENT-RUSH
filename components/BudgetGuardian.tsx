'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, Wallet } from 'lucide-react';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { AnimatedNumber, ProgressBar, RadialGauge } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { cn, formatCurrency } from '@/lib/utils';

type Status = 'healthy' | 'tight' | 'critical' | 'over';

const STATUS_META: Record<
  Status,
  { label: string; color: string; text: string; ring: string; icon: React.ReactNode; verdict: string }
> = {
  healthy: {
    label: 'On track',
    color: 'rgb(var(--positive))',
    text: 'text-positive',
    ring: 'border-line',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    verdict: 'You have room today. Keep it boring.',
  },
  tight: {
    label: 'Running hot',
    color: 'rgb(var(--warning))',
    text: 'text-warning',
    ring: 'border-warning/30',
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    verdict: 'Your pace overshoots the month. Trim something small today.',
  },
  critical: {
    label: 'Broke alert',
    color: 'rgb(var(--negative))',
    text: 'text-negative',
    ring: 'border-negative/40',
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    verdict: 'Under 10% of your allowance left. Treat every rupee as the last one.',
  },
  over: {
    label: 'Over budget',
    color: 'rgb(var(--negative))',
    text: 'text-negative',
    ring: 'border-negative/50',
    icon: <ShieldX className="h-3.5 w-3.5" />,
    verdict: 'You are past your allowance. Damage control mode until the month resets.',
  },
};

/**
 * Broke Alert. The whole card shifts toward red as the budget dies, and the
 * "safe to spend right now" figure recomputes every minute so it stays honest.
 */
export const BudgetGuardian: React.FC = () => {
  const { budget, player } = useApp();
  const [, forceTick] = useState(0);

  // Recompute on the minute so "days left" flips correctly around midnight.
  useEffect(() => {
    const timer = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const meta = STATUS_META[budget.status];
  const noAllowance = player.monthly_allowance <= 0;

  const advice = useMemo(() => {
    if (noAllowance) return null;
    if (budget.remaining < 0) {
      return `You are ${formatCurrency(Math.abs(budget.remaining))} past your allowance with ${
        budget.daysLeft
      } ${budget.daysLeft === 1 ? 'day' : 'days'} to go.`;
    }
    if (budget.overspentToday) {
      const over = budget.todaySpend - budget.todayBudget;
      return `Skip the chai — you are ${formatCurrency(over)} over today's limit already.`;
    }
    const remaining = budget.todayBudget - budget.todaySpend;
    if (remaining < 100) {
      return `Only ${formatCurrency(remaining)} left for today. Anything more eats into tomorrow.`;
    }
    return `${formatCurrency(remaining)} still safe to spend today.`;
  }, [budget, noAllowance]);

  const todayRatio =
    budget.todayBudget > 0 ? Math.min(1, budget.todaySpend / budget.todayBudget) : 0;

  return (
    <Panel className={cn('border', meta.ring)}>
      <PanelHeader
        title="Budget guardian"
        subtitle={
          noAllowance ? 'Set an allowance to activate' : `${budget.daysLeft} days left this month`
        }
        icon={<Shield className="h-3.5 w-3.5" />}
        action={
          <span
            className={cn(
              'chip',
              budget.status === 'healthy' && 'chip-positive',
              budget.status === 'tight' && 'chip-warning',
              (budget.status === 'critical' || budget.status === 'over') && 'chip-negative'
            )}
          >
            {meta.icon}
            {meta.label}
          </span>
        }
      />

      <PanelBody className="space-y-4">
        <div className="flex items-center gap-5">
          <RadialGauge
            value={Math.min(100, budget.usedRatio * 100)}
            size={124}
            thickness={8}
            color={meta.color}
            gap={0.3}
          >
            <p className="eyebrow">Used</p>
            <AnimatedNumber
              value={Math.round(budget.usedRatio * 100)}
              format={(n) => `${Math.round(n)}%`}
              className="text-2xl font-semibold text-ink"
            />
          </RadialGauge>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="eyebrow">Safe to spend today</p>
              <p className={cn('metric text-3xl', budget.overspentToday && 'text-negative')}>
                <AnimatedNumber
                  value={Math.max(0, budget.todayBudget - budget.todaySpend)}
                  format={(n) => formatCurrency(n)}
                />
              </p>
            </div>

            <div className="space-y-1">
              <ProgressBar
                value={todayRatio * 100}
                height={5}
                barClassName={
                  budget.overspentToday
                    ? 'bg-negative'
                    : todayRatio > 0.7
                      ? 'bg-warning'
                      : 'bg-positive'
                }
              />
              <div className="flex justify-between text-2xs text-faint">
                <span className="tabnum">{formatCurrency(budget.todaySpend)} today</span>
                <span className="tabnum">limit {formatCurrency(budget.todayBudget)}</span>
              </div>
            </div>
          </div>
        </div>

        {advice && (
          <p
            className={cn(
              'rounded-lg border px-3 py-2 text-xs font-medium leading-relaxed',
              budget.status === 'healthy'
                ? 'border-line bg-surface text-muted'
                : cn(
                    meta.text,
                    budget.status === 'tight'
                      ? 'border-warning/25 bg-warning/6'
                      : 'border-negative/25 bg-negative/6'
                  )
            )}
          >
            {advice}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 border-t border-line pt-3">
          {[
            { label: 'Allowance', value: player.monthly_allowance },
            { label: 'Spent', value: budget.spentThisMonth },
            { label: 'Left', value: budget.remaining },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="eyebrow">{stat.label}</p>
              <p
                className={cn(
                  'text-sm font-semibold tabnum',
                  stat.label === 'Left' && stat.value < 0 ? 'text-negative' : 'text-ink'
                )}
              >
                {formatCurrency(stat.value)}
              </p>
            </div>
          ))}
        </div>

        {budget.projectedMonthEnd > 0 && !noAllowance && (
          <div className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3">
            <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
            <p className="text-2xs leading-relaxed text-muted">
              At this pace you finish the month at{' '}
              <span className="font-semibold text-ink tabnum">
                {formatCurrency(budget.projectedMonthEnd)}
              </span>
              {budget.projectedMonthEnd > player.monthly_allowance ? (
                <>
                  {' '}— that is{' '}
                  <span className="font-semibold text-negative tabnum">
                    {formatCurrency(budget.projectedMonthEnd - player.monthly_allowance)}
                  </span>{' '}
                  over.
                </>
              ) : (
                <>
                  {' '}— leaving{' '}
                  <span className="font-semibold text-positive tabnum">
                    {formatCurrency(player.monthly_allowance - budget.projectedMonthEnd)}
                  </span>{' '}
                  to save.
                </>
              )}
            </p>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
};

/** Slim always-visible banner that turns the whole app red when money runs out. */
export const BrokeAlertBanner: React.FC = () => {
  const { budget, player } = useApp();

  if (player.monthly_allowance <= 0) return null;
  if (budget.status !== 'over' && budget.status !== 'critical') return null;

  const isOver = budget.status === 'over';

  return (
    <div
      className={cn(
        'glass flex items-center gap-2 border-b px-4 py-2.5 text-xs font-medium backdrop-blur-md sm:px-6',
        isOver
          ? 'border-negative/25 bg-negative/10 text-negative'
          : 'border-warning/25 bg-warning/10 text-warning'
      )}
    >
      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        {isOver
          ? `Over budget by ${formatCurrency(Math.abs(budget.remaining))} with ${budget.daysLeft} days left`
          : `Only ${formatCurrency(budget.remaining)} left for ${budget.daysLeft} days — ${formatCurrency(budget.safeDailyAllowance)} a day`}
      </span>
    </div>
  );
};
