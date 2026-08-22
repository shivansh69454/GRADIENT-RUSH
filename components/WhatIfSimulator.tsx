'use client';

import React, { useMemo, useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Segmented, Slider } from '@/components/ui/Field';
import { AreaChart, AnimatedNumber } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { cn, formatCurrency, formatDuration } from '@/lib/utils';

/** Things a student might actually be saving toward, cheapest first. */
const MILESTONES = [
  { name: 'a new phone', price: 25000, emoji: '📱' },
  { name: 'a MacBook Air', price: 99000, emoji: '💻' },
  { name: 'a Europe trip', price: 250000, emoji: '✈️' },
  { name: 'a car down payment', price: 400000, emoji: '🚗' },
  { name: 'your first ₹10 lakh', price: 1000000, emoji: '🏆' },
  { name: 'a house down payment', price: 2500000, emoji: '🏠' },
];

type Horizon = '1' | '5' | '10' | '20';

/** Monthly SIP future value with monthly compounding. */
const futureValue = (monthly: number, years: number, annualRate: number): number => {
  const months = years * 12;
  const r = annualRate / 12;
  if (r === 0) return monthly * months;
  return monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
};

const seriesFor = (monthly: number, years: number, rate: number, points = 24): number[] =>
  Array.from({ length: points + 1 }, (_, i) => futureValue(monthly, (years * i) / points, rate));

export const WhatIfSimulator: React.FC = () => {
  const { budget, player } = useApp();

  // Anchor the baseline to what the user is actually managing to save.
  const observedPace = Math.max(
    0,
    Math.round((player.monthly_allowance - budget.projectedMonthEnd) / 100) * 100
  );
  const [base, setBase] = useState(observedPace || 500);
  const [extra, setExtra] = useState(500);
  const [rate, setRate] = useState(12);
  const [horizon, setHorizon] = useState<Horizon>('10');

  const years = Number(horizon);
  const boosted = base + extra;

  const baseValue = useMemo(() => futureValue(base, years, rate / 100), [base, years, rate]);
  const boostedValue = useMemo(
    () => futureValue(boosted, years, rate / 100),
    [boosted, years, rate]
  );

  const baseSeries = useMemo(() => seriesFor(base, years, rate / 100), [base, years, rate]);
  const boostedSeries = useMemo(() => seriesFor(boosted, years, rate / 100), [boosted, years, rate]);

  const labels = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) =>
        i % 4 === 0 ? `${Math.round((years * i) / 24)}y` : ''
      ),
    [years]
  );

  const invested = boosted * years * 12;
  const growth = boostedValue - invested;
  const difference = boostedValue - baseValue;

  const unlocked = useMemo(
    () => MILESTONES.filter((m) => m.price <= boostedValue),
    [boostedValue]
  );
  const nextMilestone = MILESTONES.find((m) => m.price > boostedValue);
  const monthsToNext =
    nextMilestone && boosted > 0
      ? (() => {
          for (let m = 1; m <= 1200; m += 1) {
            if (futureValue(boosted, m / 12, rate / 100) >= nextMilestone.price) return m;
          }
          return Infinity;
        })()
      : Infinity;

  return (
    <Panel>
      <PanelHeader
        title="What if"
        subtitle="See what saving a little more actually becomes"
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        action={
          <Segmented
            options={[
              { value: '1', label: '1y' },
              { value: '5', label: '5y' },
              { value: '10', label: '10y' },
              { value: '20', label: '20y' },
            ]}
            value={horizon}
            onChange={setHorizon}
          />
        }
      />

      <PanelBody className="space-y-5">
        {/* Headline comparison */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-3.5">
            <p className="eyebrow">Current pace · {formatCurrency(base)}/mo</p>
            <p className="mt-1 text-xl font-semibold tabnum text-muted">
              <AnimatedNumber value={baseValue} format={(n) => formatCurrency(n, true)} />
            </p>
            <p className="mt-0.5 text-2xs text-faint">in {years} years</p>
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/[0.06] p-3.5">
            <p className="eyebrow text-accent">
              Saving {formatCurrency(extra)} more · {formatCurrency(boosted)}/mo
            </p>
            <p className="mt-1 text-xl font-semibold tabnum text-ink">
              <AnimatedNumber value={boostedValue} format={(n) => formatCurrency(n, true)} />
            </p>
            <p className="mt-0.5 text-2xs font-medium text-accent">
              +{formatCurrency(difference, true)} more
            </p>
          </div>
        </div>

        <AreaChart
          series={[
            { label: 'Boosted', values: boostedSeries, color: 'rgb(var(--accent))' },
            { label: 'Current', values: baseSeries, color: 'rgb(var(--muted))' },
          ]}
          labels={labels}
          height={192}
        />

        {/* Controls */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Saving now</span>
              <span className="text-xs font-semibold tabnum text-ink">{formatCurrency(base)}</span>
            </div>
            <Slider
              min={0}
              max={20000}
              step={250}
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Extra per month</span>
              <span className="text-xs font-semibold tabnum text-accent">
                +{formatCurrency(extra)}
              </span>
            </div>
            <Slider
              min={0}
              max={10000}
              step={100}
              value={extra}
              onChange={(e) => setExtra(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Annual return</span>
              <span className="text-xs font-semibold tabnum text-ink">{rate}%</span>
            </div>
            <Slider
              min={4}
              max={18}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <p className="text-[10px] text-faint">
              {rate <= 7
                ? 'Fixed deposit territory'
                : rate <= 13
                  ? 'Historical index fund range'
                  : 'Optimistic — do not plan on this'}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3 border-t border-line pt-3.5">
          <div>
            <p className="eyebrow">You put in</p>
            <p className="text-sm font-semibold tabnum text-ink">{formatCurrency(invested, true)}</p>
          </div>
          <div>
            <p className="eyebrow">Growth</p>
            <p className="text-sm font-semibold tabnum text-positive">
              {formatCurrency(growth, true)}
            </p>
          </div>
          <div>
            <p className="eyebrow">Growth share</p>
            <p className="text-sm font-semibold tabnum text-ink">
              {boostedValue > 0 ? Math.round((growth / boostedValue) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Milestones */}
        {(unlocked.length > 0 || nextMilestone) && (
          <div className="space-y-2 rounded-lg border border-line bg-surface p-3">
            <p className="eyebrow flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              What that buys
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unlocked.map((milestone) => (
                <span key={milestone.name} className="chip chip-positive">
                  {milestone.emoji} {milestone.name}
                </span>
              ))}
              {unlocked.length === 0 && (
                <span className="text-2xs text-faint">
                  Nudge the sliders up to clear the first milestone.
                </span>
              )}
            </div>
            {nextMilestone && Number.isFinite(monthsToNext) && (
              <p className="text-2xs leading-relaxed text-muted">
                {nextMilestone.emoji} {nextMilestone.name} (
                {formatCurrency(nextMilestone.price, true)}) arrives in{' '}
                <span className={cn('font-semibold text-ink')}>
                  {formatDuration(monthsToNext)}
                </span>{' '}
                at {formatCurrency(boosted)} a month.
              </p>
            )}
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-faint">
          Projections assume a steady monthly contribution compounded monthly. Real returns vary
          year to year and are never guaranteed — this is a planning tool, not a promise.
        </p>
      </PanelBody>
    </Panel>
  );
};
