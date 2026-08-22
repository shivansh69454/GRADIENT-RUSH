'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  LifeBuoy,
  ShieldAlert,
  Skull,
  Swords,
  TrendingDown,
  XCircle,
} from 'lucide-react';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AnimatedNumber, ProgressBar } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import {
  XP_PERFECT_BONUS,
  XP_PER_SURVIVED_DAY,
  buildSurvivalPlan,
  evaluateSurvival,
  shouldOfferSurvival,
} from '@/lib/survival';
import { getSurvival, setSurvival, IDLE_SURVIVAL } from '@/lib/storage';
import { onCommand } from '@/lib/bus';
import { milestoneConfetti } from '@/lib/celebrate';
import type { SurvivalDay, SurvivalState } from '@/types';
import { cn, formatCurrency, formatShortDate } from '@/lib/utils';

const DAY_STYLES: Record<SurvivalDay['status'], string> = {
  survived: 'border-positive/40 bg-positive/12 text-positive',
  broken: 'border-negative/40 bg-negative/12 text-negative',
  today: 'border-accent bg-accent/12 text-accent',
  upcoming: 'border-line bg-surface text-faint',
};

/**
 * Survival Mode — what to do when the month is already lost.
 *
 * Every budgeting app is happy to tell you that you overspent, which is exactly
 * the least useful moment to be given a number. This commits the user to a
 * short, specific rescue: a hard daily cap derived from what is actually left,
 * the categories that have to give, and day-by-day scoring so getting through it
 * feels like beating something rather than merely going without.
 */
export const SurvivalMode: React.FC = () => {
  const { expenses, budget, awardXP, pushToast } = useApp();

  const [state, setState] = useState<SurvivalState>(IDLE_SURVIVAL);
  const [hydrated, setHydrated] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setState(getSurvival());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: SurvivalState) => {
    setState(next);
    setSurvival(next);
  }, []);

  // The plan is rebuilt from live data whenever the user opens the preview, so
  // it always reflects today's remaining balance rather than a stale snapshot.
  const draftPlan = useMemo(
    () => (hydrated ? buildSurvivalPlan(expenses, budget) : null),
    [hydrated, expenses, budget]
  );

  const progress = useMemo(() => evaluateSurvival(state, expenses), [state, expenses]);

  const openPreview = useCallback(() => setPreviewOpen(true), []);
  useEffect(() => onCommand('open-survival', openPreview), [openPreview]);

  // Pay out XP for completed days exactly once each.
  useEffect(() => {
    if (!progress || progress.unrewarded.length === 0) return;
    const earned = progress.unrewarded.length * XP_PER_SURVIVED_DAY;
    const dates = progress.unrewarded;

    persist({ ...state, rewardedDates: [...state.rewardedDates, ...dates] });
    awardXP(earned, `Survived ${dates.length} capped ${dates.length === 1 ? 'day' : 'days'}`);
  }, [progress, state, persist, awardXP]);

  const activate = () => {
    if (!draftPlan) return;
    persist({
      active: true,
      plan: draftPlan,
      startedAt: new Date().toISOString(),
      rewardedDates: [],
    });
    setPreviewOpen(false);
    pushToast({
      variant: 'warning',
      icon: '🛟',
      title: 'Survival Mode active',
      description: `${formatCurrency(draftPlan.dailyCap)} a day for ${draftPlan.days} days. Every clean day is ${XP_PER_SURVIVED_DAY} XP.`,
    });
  };

  const finish = () => {
    if (progress?.complete && progress.perfect) {
      void milestoneConfetti();
      awardXP(XP_PERFECT_BONUS, 'Perfect Survival Mode run');
      pushToast({
        variant: 'success',
        icon: '🏆',
        title: 'Flawless run',
        description: `You held the line all ${progress.days.length} days and kept ${formatCurrency(progress.saved)}.`,
      });
    }
    persist(IDLE_SURVIVAL);
  };

  if (!hydrated) return null;

  // ------------------------------------------------------------ active run

  if (state.active && state.plan && progress) {
    const { plan } = state;
    const overToday = progress.todayRemaining < 0;

    return (
      <Panel className={cn(overToday && 'ring-1 ring-negative/30')}>
        <PanelHeader
          title="Survival Mode"
          subtitle={`Day ${Math.min(progress.daysSurvived + progress.daysBroken + 1, plan.days)} of ${plan.days} · ${formatCurrency(plan.dailyCap)} a day`}
          icon={<LifeBuoy className="h-3.5 w-3.5" />}
          action={
            <Button variant="ghost" size="sm" onClick={finish}>
              {progress.complete ? 'Finish' : 'End early'}
            </Button>
          }
        />

        <div
          className={cn(
            'border-b border-line px-4 py-3.5',
            overToday ? 'bg-negative/6' : 'bg-surface'
          )}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{overToday ? 'Over today’s cap by' : 'Left to spend today'}</p>
              <p
                className={cn(
                  'text-3xl font-semibold tabnum',
                  overToday ? 'text-negative' : 'text-positive'
                )}
              >
                <AnimatedNumber
                  value={Math.abs(progress.todayRemaining)}
                  format={(n) => formatCurrency(n)}
                />
              </p>
              <p className="mt-0.5 text-2xs text-faint">
                {formatCurrency(progress.todaySpent)} spent of {formatCurrency(plan.dailyCap)}
              </p>
            </div>

            <div className="text-right">
              <p className="eyebrow">Kept so far</p>
              <p className="text-xl font-semibold tabnum text-ink">
                {formatCurrency(progress.saved)}
              </p>
              <p className="text-2xs text-faint">
                vs your old {formatCurrency(plan.baselineDaily)}/day pace
              </p>
            </div>
          </div>

          <ProgressBar
            value={Math.min(progress.todaySpent, plan.dailyCap)}
            max={plan.dailyCap || 1}
            height={4}
            className="mt-3"
            barClassName={overToday ? 'bg-negative' : 'bg-positive'}
          />
        </div>

        <PanelBody className="space-y-3.5">
          <div className="flex flex-wrap gap-1.5">
            {progress.days.map((day, index) => (
              <div
                key={day.date}
                title={`${formatShortDate(day.date)} · ${formatCurrency(day.spent)} of ${formatCurrency(day.cap)}`}
                className={cn(
                  'flex min-w-[62px] flex-1 flex-col items-center gap-0.5 rounded-lg border px-2 py-2 transition-all',
                  DAY_STYLES[day.status]
                )}
              >
                <span className="text-2xs font-medium uppercase tracking-wide opacity-70">
                  Day {index + 1}
                </span>
                {day.status === 'survived' && <CheckCircle2 className="h-4 w-4" />}
                {day.status === 'broken' && <XCircle className="h-4 w-4" />}
                {day.status === 'today' && <Swords className="h-4 w-4" />}
                {day.status === 'upcoming' && <span className="h-4 w-4 rounded-full border border-current opacity-40" />}
                <span className="text-2xs tabnum">
                  {day.status === 'upcoming' ? '—' : formatCurrency(day.spent, true)}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <p className="eyebrow">Survived</p>
              <p className="text-lg font-semibold tabnum text-positive">{progress.daysSurvived}</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <p className="eyebrow">Blown</p>
              <p className="text-lg font-semibold tabnum text-negative">{progress.daysBroken}</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <p className="eyebrow">XP earned</p>
              <p className="text-lg font-semibold tabnum text-ink">
                {progress.daysSurvived * XP_PER_SURVIVED_DAY}
              </p>
            </div>
          </div>

          {progress.complete ? (
            <div
              className={cn(
                'rounded-lg border p-3',
                progress.perfect
                  ? 'border-positive/30 bg-positive/6'
                  : 'border-warning/30 bg-warning/6'
              )}
            >
              <p className="text-sm font-medium text-ink">
                {progress.perfect ? 'Perfect run' : 'Run complete'}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {progress.perfect
                  ? `All ${plan.days} days under cap. Finish to claim the ${XP_PERFECT_BONUS} XP bonus.`
                  : `${progress.daysSurvived} of ${plan.days} days held. You still kept ${formatCurrency(progress.saved)}.`}
              </p>
              <Button variant="primary" size="sm" onClick={finish} className="mt-2">
                Claim and exit
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5 rounded-lg border border-line bg-surface p-3">
              <p className="eyebrow">Holding the line</p>
              <ul className="space-y-1">
                {plan.swaps.slice(0, 2).map((swap) => (
                  <li key={swap} className="flex gap-1.5 text-2xs leading-relaxed text-muted">
                    <span className="text-faint">·</span>
                    {swap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </PanelBody>
      </Panel>
    );
  }

  // ---------------------------------------------------------------- offer

  const offering = shouldOfferSurvival(budget);

  return (
    <>
      <Panel className={cn(offering && 'ring-1 ring-warning/25')}>
        <PanelHeader
          title="Survival Mode"
          subtitle="A short rescue plan for when the month goes wrong"
          icon={<LifeBuoy className="h-3.5 w-3.5" />}
        />

        <PanelBody className="space-y-3">
          {offering ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/6 p-3">
              <ShieldAlert className="mt-px h-4 w-4 shrink-0 text-warning" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink">Your budget needs rescuing</p>
                <p className="mt-0.5 text-2xs leading-relaxed text-muted">
                  {draftPlan?.reason}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              Nothing to rescue right now — your pace is fine. Keep this in your back pocket for the
              week the money runs out early.
            </p>
          )}

          {draftPlan && draftPlan.dailyCap > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <p className="eyebrow">Daily cap</p>
                <p className="text-base font-semibold tabnum text-ink">
                  {formatCurrency(draftPlan.dailyCap)}
                </p>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <p className="eyebrow">For</p>
                <p className="text-base font-semibold tabnum text-ink">{draftPlan.days} days</p>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <p className="eyebrow">Cut from</p>
                <p className="text-base font-semibold tabnum text-ink">
                  {formatCurrency(draftPlan.baselineDaily)}
                </p>
              </div>
            </div>
          )}

          <Button
            variant={offering ? 'primary' : 'secondary'}
            onClick={() => setPreviewOpen(true)}
            icon={<LifeBuoy className="h-3.5 w-3.5" />}
            className="w-full"
            disabled={!draftPlan || draftPlan.dailyCap <= 0}
          >
            {offering ? 'See the rescue plan' : 'Plan a lockdown week'}
          </Button>

          <p className="text-2xs leading-relaxed text-faint">
            {XP_PER_SURVIVED_DAY} XP for every day under the cap, {XP_PERFECT_BONUS} XP bonus for a
            clean run.
          </p>
        </PanelBody>
      </Panel>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Your survival plan"
        subtitle={
          draftPlan
            ? `${formatCurrency(draftPlan.dailyCap)} a day until ${formatShortDate(draftPlan.endDate)}`
            : undefined
        }
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
              Not yet
            </Button>
            <Button
              variant="primary"
              onClick={activate}
              icon={<Skull className="h-3.5 w-3.5" />}
              disabled={!draftPlan}
            >
              Commit for {draftPlan?.days ?? 0} days
            </Button>
          </>
        }
      >
        {draftPlan && (
          <div className="space-y-4 p-4">
            <div className="rounded-lg border border-line bg-surface p-3.5">
              <p className="eyebrow">Why</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{draftPlan.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Daily cap', value: formatCurrency(draftPlan.dailyCap) },
                { label: 'Total budget', value: formatCurrency(draftPlan.totalCap) },
                { label: 'Duration', value: `${draftPlan.days} days` },
                {
                  label: 'Daily cut',
                  value: formatCurrency(Math.max(0, draftPlan.baselineDaily - draftPlan.dailyCap)),
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-line bg-surface p-2.5">
                  <p className="eyebrow">{item.label}</p>
                  <p className="text-sm font-semibold tabnum text-ink">{item.value}</p>
                </div>
              ))}
            </div>

            {draftPlan.cuts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-ink">What has to give</p>
                <div className="overflow-hidden rounded-lg border border-line">
                  {draftPlan.cuts.slice(0, 6).map((cut) => (
                    <div
                      key={cut.category}
                      className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-0"
                    >
                      <span className="text-base leading-none">{cut.emoji}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-ink">
                        {cut.category}
                      </span>
                      <span className="shrink-0 text-2xs tabnum text-faint line-through">
                        {formatCurrency(cut.currentDaily)}
                      </span>
                      <span className="shrink-0 text-xs font-medium tabnum text-ink">
                        {cut.cappedDaily <= 0 ? '₹0' : formatCurrency(cut.cappedDaily)}
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5 text-2xs tabnum text-positive">
                        <TrendingDown className="h-3 w-3" />
                        {formatCurrency(cut.dailySaving)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-2xs text-faint">
                  Rent, bills, health and education are never cut — only the discretionary spend is
                  squeezed.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-ink">Exactly how to do it</p>
              <ul className="space-y-1.5">
                {draftPlan.swaps.map((swap) => (
                  <li
                    key={swap}
                    className="flex gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-muted"
                  >
                    <span className="text-accent">→</span>
                    {swap}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-accent/25 bg-accent/6 p-3">
              <p className="text-xs text-muted">
                Hold every day and you bank{' '}
                <span className="font-semibold tabnum text-accent">
                  {draftPlan.days * XP_PER_SURVIVED_DAY + XP_PERFECT_BONUS} XP
                </span>{' '}
                plus roughly{' '}
                <span className="font-semibold tabnum text-ink">
                  {formatCurrency(
                    Math.max(0, draftPlan.baselineDaily - draftPlan.dailyCap) * draftPlan.days
                  )}
                </span>{' '}
                kept out of the fire.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
