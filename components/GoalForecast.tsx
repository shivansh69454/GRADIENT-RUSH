'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Dices, Info, Target, TrendingUp } from 'lucide-react';
import { Panel, PanelBody, PanelHeader, EmptyState } from '@/components/ui/Panel';
import { FieldShell, MoneyInput, Segmented, Select, Slider } from '@/components/ui/Field';
import { AnimatedNumber, FanChart, RadialGauge } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { savingsProfile } from '@/lib/analytics';
import { ASSET_PRESETS, requiredBoost, runForecast, verdictFor, type AssetKey } from '@/lib/forecast';
import { cn, formatCurrency, formatDuration } from '@/lib/utils';

const HORIZONS = [
  { value: '12', label: '1 yr' },
  { value: '24', label: '2 yr' },
  { value: '36', label: '3 yr' },
  { value: '60', label: '5 yr' },
];

const TONE_CLASS = {
  positive: 'text-positive',
  warning: 'text-warning',
  negative: 'text-negative',
} as const;

const TONE_STROKE = {
  positive: 'rgb(var(--positive))',
  warning: 'rgb(var(--warning))',
  negative: 'rgb(var(--negative))',
} as const;

/**
 * "You'll get there in 18 months" is a lie told by an average.
 *
 * This runs the user's real saving pace — and, crucially, its real
 * month-to-month volatility — forward a thousand times, then reports how many of
 * those futures actually reach the target. The cone of outcomes is the honest
 * answer, and the boost hint turns it into something actionable rather than
 * merely sobering.
 */
export const GoalForecast: React.FC = () => {
  const { goals, expenses, player } = useApp();

  const profile = useMemo(
    () => savingsProfile(expenses, player.monthly_allowance),
    [expenses, player.monthly_allowance]
  );

  const [goalId, setGoalId] = useState<string>('custom');
  const [customTarget, setCustomTarget] = useState('50000');
  const [months, setMonths] = useState('24');
  const [asset, setAsset] = useState<AssetKey>('index');
  const [boost, setBoost] = useState(0);

  // Goals arrive from storage after mount, so the default has to wait for them.
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched || goals.length === 0) return;
    setGoalId(goals[0].id);
  }, [goals, touched]);

  const goal = goals.find((g) => g.id === goalId);
  const target = goal ? goal.targetAmount : Math.max(0, Number(customTarget) || 0);
  const startingAmount = goal ? goal.savedAmount : 0;

  const preset = ASSET_PRESETS.find((a) => a.key === asset) ?? ASSET_PRESETS[2];
  const horizon = Number(months);

  // A committed monthly contribution beats an inferred pace when one exists.
  const basePace = goal?.monthlyContribution && goal.monthlyContribution > 0
    ? goal.monthlyContribution
    : profile.monthlyPace;

  const input = useMemo(
    () => ({
      startingAmount,
      target,
      monthlySavings: basePace + boost,
      savingsVolatility: profile.volatility,
      months: horizon,
      annualReturn: preset.annualReturn,
      returnVolatility: preset.returnVolatility,
    }),
    [startingAmount, target, basePace, boost, profile.volatility, horizon, preset]
  );

  const forecast = useMemo(() => runForecast(input), [input]);
  const verdict = verdictFor(forecast.probability);

  // Only worth computing a rescue when the odds are actually poor.
  const neededBoost = useMemo(() => {
    if (forecast.probability >= 0.85 || target <= 0) return null;
    return requiredBoost(input, 0.85);
  }, [forecast.probability, input, target]);

  const hasData = player.monthly_allowance > 0 && (basePace > 0 || startingAmount > 0);

  if (goals.length === 0 && !hasData) {
    return (
      <Panel>
        <PanelHeader
          title="Goal forecast"
          subtitle="A thousand simulated futures"
          icon={<Dices className="h-3.5 w-3.5" />}
        />
        <EmptyState
          icon="🎲"
          title="Set an allowance and a goal first"
          description="The simulation needs your real saving pace to be worth anything. Add a monthly allowance and log a few expenses, and this fills in."
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Goal forecast"
        subtitle={`${forecast.runs.toLocaleString('en-IN')} simulated futures, run on your own numbers`}
        icon={<Dices className="h-3.5 w-3.5" />}
        action={
          <span className="chip">
            {profile.monthsObserved > 0
              ? `${profile.monthsObserved} ${profile.monthsObserved === 1 ? 'month' : 'months'} measured`
              : 'Estimated pace'}
          </span>
        }
      />

      <PanelBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldShell label="Goal">
            <Select
              value={goalId}
              onChange={(e) => {
                setTouched(true);
                setGoalId(e.target.value);
              }}
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.icon} {g.name} · {formatCurrency(g.targetAmount)}
                </option>
              ))}
              <option value="custom">Custom target</option>
            </Select>
          </FieldShell>

          {goal ? (
            <FieldShell label="Already saved" hint={`${formatCurrency(target - startingAmount)} to go`}>
              <div className="field flex items-center tabnum">
                {formatCurrency(startingAmount)}
              </div>
            </FieldShell>
          ) : (
            <FieldShell label="Target amount">
              <MoneyInput
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                placeholder="50000"
              />
            </FieldShell>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <p className="eyebrow">Time horizon</p>
            <Segmented options={HORIZONS} value={months} onChange={setMonths} />
          </div>
          <div className="space-y-1.5">
            <p className="eyebrow">Where the money sits</p>
            <Select
              value={asset}
              onChange={(e) => setAsset(e.target.value as AssetKey)}
              className="h-8 text-xs"
            >
              {ASSET_PRESETS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label} — {a.note}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Verdict */}
        <div className="grid gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <div className="flex justify-center">
            <RadialGauge
              value={forecast.probability * 100}
              size={132}
              thickness={9}
              color={TONE_STROKE[verdict.tone]}
            >
              <p className={cn('text-2xl font-semibold tabnum', TONE_CLASS[verdict.tone])}>
                <AnimatedNumber
                  value={forecast.probability * 100}
                  format={(n) => `${Math.round(n)}%`}
                />
              </p>
              <p className="text-2xs text-faint">make it</p>
            </RadialGauge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-semibold', TONE_CLASS[verdict.tone])}>
                {verdict.label}
              </span>
              <span className="chip">
                <Target className="h-3 w-3" />
                {formatCurrency(target)} in {formatDuration(horizon)}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-muted">{verdict.blurb}</p>

            <p className="text-xs leading-relaxed text-muted">
              Saving{' '}
              <span className="font-medium tabnum text-ink">{formatCurrency(basePace + boost)}</span>{' '}
              a month with your usual swing of ±
              <span className="tabnum">{formatCurrency(profile.volatility)}</span>,{' '}
              {forecast.medianMonth !== null ? (
                <>
                  the typical run gets there in{' '}
                  <span className="font-medium text-ink">
                    {formatDuration(forecast.medianMonth)}
                  </span>
                  .
                </>
              ) : (
                <>most runs do not reach it inside this window.</>
              )}
            </p>

            {neededBoost !== null && neededBoost > 0 && (
              <button
                onClick={() => setBoost(neededBoost)}
                className="flex w-full items-center gap-2 rounded-lg border border-accent/30 bg-accent/6 px-3 py-2 text-left transition-colors hover:bg-accent/12"
              >
                <TrendingUp className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-xs text-muted">
                  Add{' '}
                  <span className="font-semibold tabnum text-accent">
                    {formatCurrency(neededBoost)}
                  </span>{' '}
                  a month and the odds pass 85%. Tap to apply.
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Boost lever */}
        <div className="space-y-2 rounded-lg border border-line bg-surface p-3.5">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium text-ink">Save extra each month</p>
            <p className="text-sm font-semibold tabnum text-accent">
              +{formatCurrency(boost)}
            </p>
          </div>
          <Slider
            min={0}
            max={Math.max(2000, Math.round((player.monthly_allowance || 10000) * 0.4))}
            step={100}
            value={boost}
            onChange={(e) => setBoost(Number(e.target.value))}
          />
          <div className="flex justify-between text-2xs text-faint">
            <span>Current pace</span>
            <span>Aggressive</span>
          </div>
        </div>

        {/* Cone of outcomes */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-ink">Range of outcomes</p>
            <div className="flex items-center gap-3 text-2xs text-faint">
              <span className="flex items-center gap-1">
                <span
                  className="h-2 w-4 rounded-sm"
                  style={{ background: TONE_STROKE[verdict.tone], opacity: 0.2 }}
                />
                10th–90th percentile
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="h-0.5 w-4 rounded-sm"
                  style={{ background: TONE_STROKE[verdict.tone] }}
                />
                Median
              </span>
            </div>
          </div>

          <FanChart
            bands={forecast.bands}
            target={target}
            color={TONE_STROKE[verdict.tone]}
            labelFor={(month) => (month === 0 ? 'Now' : `${month}m`)}
          />

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Unlucky run', value: forecast.finalP10, tone: 'text-negative' },
              { label: 'Typical run', value: forecast.finalP50, tone: 'text-ink' },
              { label: 'Lucky run', value: forecast.finalP90, tone: 'text-positive' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-line bg-surface p-2.5">
                <p className="eyebrow">{item.label}</p>
                <p className={cn('text-base font-semibold tabnum', item.tone)}>
                  {formatCurrency(item.value, true)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="flex items-start gap-1.5 text-2xs leading-relaxed text-faint">
          <Info className="mt-px h-3 w-3 shrink-0" />
          Each run draws a random monthly contribution around your measured pace and a random market
          return around {Math.round(preset.annualReturn * 100)}%. The seed is fixed, so the same
          inputs always give the same answer — this is a model of uncertainty, not a promise.
        </p>
      </PanelBody>
    </Panel>
  );
};
