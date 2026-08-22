'use client';

import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Segmented } from '@/components/ui/Field';
import { BarSeries } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { dailySeries, sum } from '@/lib/analytics';
import { cn, formatCurrency, getTodayDate } from '@/lib/utils';

type Range = '7' | '14' | '30';

export const SpendingTrend: React.FC = () => {
  const { expenses, budget, player } = useApp();
  const [range, setRange] = useState<Range>('7');

  const days = Number(range);
  const series = useMemo(() => dailySeries(expenses, days), [expenses, days]);
  const today = getTodayDate();

  const total = useMemo(() => sum(expenses.filter((e) => series.some((s) => s.date === e.date))), [expenses, series]);
  const average = total / days;
  const dailyTarget = player.monthly_allowance > 0 ? player.monthly_allowance / 30 : 0;
  const activeDays = series.filter((s) => s.total > 0).length;

  const data = series.map((s) => ({
    label: days > 14 ? s.date.slice(-2) : s.label,
    value: s.total,
    highlight: s.date === today,
  }));

  return (
    <Panel>
      <PanelHeader
        title="Spending trend"
        subtitle={`${formatCurrency(average)} average per day`}
        icon={<BarChart3 className="h-3.5 w-3.5" />}
        action={
          <Segmented
            options={[
              { value: '7', label: '7d' },
              { value: '14', label: '14d' },
              { value: '30', label: '30d' },
            ]}
            value={range}
            onChange={setRange}
          />
        }
      />

      <PanelBody className="space-y-4">
        <div className="relative">
          {dailyTarget > 0 && (
            <div
              className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-warning/50"
              style={{
                bottom: `${Math.min(
                  92,
                  (dailyTarget / Math.max(...data.map((d) => d.value), dailyTarget)) * 100
                )}%`,
              }}
            >
              <span className="absolute -top-4 right-0 rounded bg-warning/12 px-1 text-[9px] font-medium text-warning">
                target {formatCurrency(dailyTarget)}
              </span>
            </div>
          )}
          <BarSeries data={data} height={128} />
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-line pt-3">
          <div>
            <p className="eyebrow">Total</p>
            <p className="text-sm font-semibold tabnum text-ink">{formatCurrency(total)}</p>
          </div>
          <div>
            <p className="eyebrow">Active days</p>
            <p className="text-sm font-semibold tabnum text-ink">
              {activeDays}
              <span className="text-faint">/{days}</span>
            </p>
          </div>
          <div>
            <p className="eyebrow">vs target</p>
            <p
              className={cn(
                'text-sm font-semibold tabnum',
                dailyTarget === 0
                  ? 'text-ink'
                  : average > dailyTarget
                    ? 'text-negative'
                    : 'text-positive'
              )}
            >
              {dailyTarget === 0
                ? '—'
                : `${average > dailyTarget ? '+' : ''}${Math.round(
                    ((average - dailyTarget) / dailyTarget) * 100
                  )}%`}
            </p>
          </div>
        </div>

        {budget.status === 'over' && (
          <p className="rounded-lg border border-negative/25 bg-negative/[0.06] px-3 py-2 text-2xs text-negative">
            You are past your monthly allowance. Every bar from here is borrowed from next month.
          </p>
        )}
      </PanelBody>
    </Panel>
  );
};
