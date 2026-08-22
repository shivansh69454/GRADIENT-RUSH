'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Ban, PiggyBank, Radar, TrendingUp, Undo2 } from 'lucide-react';
import { Panel, PanelBody, PanelHeader, EmptyState } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { AnimatedNumber } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import {
  cadenceLabel,
  daysUntil,
  detectSubscriptions,
  investedValue,
  leechSummary,
} from '@/lib/subscriptions';
import { getKeptSubscriptions, setKeptSubscriptions } from '@/lib/storage';
import { milestoneConfetti } from '@/lib/celebrate';
import type { Subscription } from '@/types';
import { cn, formatCurrency, formatShortDate, getTodayDate, uid } from '@/lib/utils';

/**
 * The money leaving your account while you are not looking.
 *
 * Nothing here is declared by the user — the recurring charges are mined out of
 * the expenses they already logged. The framing is deliberate: a subscription
 * priced as "₹199/month" is really "₹2,388 a year", and cancelling it is only
 * motivating if the money visibly goes somewhere better, so every row can be
 * converted straight into a funded savings goal.
 */
export const SubscriptionRadar: React.FC = () => {
  const { expenses, player, goals, saveGoals, pushToast, awardXP } = useApp();
  const [kept, setKept] = useState<string[]>([]);
  const [justCancelled, setJustCancelled] = useState<string | null>(null);

  useEffect(() => setKept(getKeptSubscriptions()), []);

  const detected = useMemo(() => detectSubscriptions(expenses), [expenses]);
  const active = useMemo(
    () => detected.filter((s) => !kept.includes(s.id)),
    [detected, kept]
  );
  const summary = useMemo(
    () => leechSummary(active, player.monthly_allowance),
    [active, player.monthly_allowance]
  );

  const keep = (subscription: Subscription) => {
    const next = [...kept, subscription.id];
    setKept(next);
    setKeptSubscriptions(next);
  };

  const restoreAll = () => {
    setKept([]);
    setKeptSubscriptions([]);
  };

  /** Cancelling is only real if the freed money is immediately committed. */
  const redirectToGoal = (subscription: Subscription) => {
    const annual = Math.round(subscription.annualCost);
    saveGoals([
      ...goals,
      {
        id: uid('goal'),
        name: `Dropped ${subscription.merchant}`,
        targetAmount: annual,
        savedAmount: 0,
        category: 'Reclaimed',
        icon: '🚫',
        createdAt: getTodayDate(),
        monthlyContribution: Math.round(subscription.monthlyCost),
        contributions: [],
      },
    ]);
    keep(subscription);
    setJustCancelled(subscription.id);
    void milestoneConfetti();
    awardXP(150, `Cancelled ${subscription.merchant}`);
    pushToast({
      variant: 'success',
      icon: '🚫',
      title: `${subscription.merchant} redirected`,
      description: `${formatCurrency(subscription.monthlyCost)}/mo now feeds a ${formatCurrency(annual)} goal.`,
    });
  };

  const hiddenCount = detected.length - active.length;

  return (
    <Panel>
      <PanelHeader
        title="Subscription radar"
        subtitle={
          detected.length > 0
            ? `${active.length} recurring ${active.length === 1 ? 'charge' : 'charges'} found in your ledger`
            : 'Mined from your own expenses'
        }
        icon={<Radar className="h-3.5 w-3.5" />}
        action={
          hiddenCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={restoreAll}
              icon={<Undo2 className="h-3.5 w-3.5" />}
            >
              {hiddenCount} hidden
            </Button>
          ) : undefined
        }
      />

      {active.length === 0 ? (
        <EmptyState
          icon="📡"
          title={detected.length === 0 ? 'No recurring charges yet' : 'All clear'}
          description={
            detected.length === 0
              ? 'Once the same merchant charges you a similar amount on a regular cadence, it shows up here with its true annual cost.'
              : 'Every subscription found is one you chose to keep. Restore them any time to review again.'
          }
        />
      ) : (
        <>
          <div className="border-b border-line bg-surface px-4 py-3.5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Leaking every year</p>
                <p className="text-2xl font-semibold tabnum text-negative">
                  <AnimatedNumber value={summary.annual} format={(n) => formatCurrency(n)} />
                </p>
                <p className="mt-0.5 text-2xs text-faint">
                  {formatCurrency(summary.monthly)}/mo
                  {summary.shareOfAllowance > 0 &&
                    ` · ${Math.round(summary.shareOfAllowance * 100)}% of your allowance`}
                </p>
              </div>

              <div className="rounded-lg border border-line bg-elevated px-3 py-2">
                <p className="eyebrow flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  If invested instead
                </p>
                <p className="text-lg font-semibold tabnum text-positive">
                  {formatCurrency(summary.investedFiveYear)}
                </p>
                <p className="text-2xs text-faint">
                  Same money into an index SIP for 5 years at 12%
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-line">
            {active.map((subscription) => {
              const days = daysUntil(subscription.nextDate);
              const isCancelled = justCancelled === subscription.id;

              return (
                <div
                  key={subscription.id}
                  className={cn(
                    'space-y-2.5 px-4 py-3 transition-colors',
                    isCancelled && 'bg-positive/6'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="mt-0.5 text-lg leading-none">{subscription.emoji}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {subscription.merchant}
                        </p>
                        <p className="mt-0.5 text-2xs text-faint">
                          {cadenceLabel(subscription.cadence)} ·{' '}
                          {subscription.occurrences} charges seen · since{' '}
                          {formatShortDate(subscription.firstDate)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabnum text-ink">
                        {formatCurrency(subscription.amount)}
                      </p>
                      <p className="text-2xs tabnum text-negative">
                        {formatCurrency(subscription.annualCost)}/yr
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={
                        days <= 3 ? 'chip chip-warning' : 'chip'
                      }
                    >
                      {days <= 0
                        ? 'Due now'
                        : days === 1
                          ? 'Charges tomorrow'
                          : `Next in ${days} days`}
                    </span>
                    <span className="chip">{subscription.category}</span>
                    <span
                      className={
                        subscription.confidence >= 0.75
                          ? 'chip chip-positive'
                          : 'chip chip-warning'
                      }
                    >
                      {Math.round(subscription.confidence * 100)}% sure
                    </span>
                    {subscription.priceCreep && (
                      <span className="chip chip-negative">
                        Price rose {formatCurrency(subscription.priceCreep.from)} →{' '}
                        {formatCurrency(subscription.priceCreep.to)}
                      </span>
                    )}
                  </div>

                  {isCancelled ? (
                    <p className="flex items-center gap-1.5 text-2xs text-positive">
                      <PiggyBank className="h-3.5 w-3.5" />
                      Redirected into a savings goal. Cancel it in the app itself to make it stick.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => redirectToGoal(subscription)}
                        icon={<Ban className="h-3.5 w-3.5" />}
                      >
                        Cancel &amp; redirect
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => keep(subscription)}>
                        I want this one
                      </Button>
                      <span className="text-2xs text-faint">
                        Worth {formatCurrency(investedValue(subscription.monthlyCost, 10))} in 10
                        years
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {detected.length > 0 && (
        <PanelBody className="border-t border-line">
          <p className="text-2xs leading-relaxed text-faint">
            Detected by finding repeat charges from the same merchant for a similar amount on a
            steady cadence. Nothing is connected to your bank — this is pattern-matching on the
            expenses already in your ledger.
          </p>
        </PanelBody>
      )}
    </Panel>
  );
};
