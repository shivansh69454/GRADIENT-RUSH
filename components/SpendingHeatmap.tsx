'use client';

import React, { useMemo, useState } from 'react';
import { Flame, Info } from 'lucide-react';
import { Panel, PanelBody, PanelHeader, EmptyState } from '@/components/ui/Panel';
import { Segmented } from '@/components/ui/Field';
import { useApp } from '@/contexts/AppContext';
import { TIME_BUCKETS, expensesLastNDays, spendingHeat, sum } from '@/lib/analytics';
import { cn, formatCurrency } from '@/lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type Window = '30' | '90';

/**
 * "Paisa Wasting" heatmap — when, not just what.
 *
 * Category charts tell you that you spend on food. This tells you that you spend
 * on food at 11pm on Fridays, which is the thing you can actually change.
 */
export const SpendingHeatmap: React.FC = () => {
  const { expenses } = useApp();
  const [window, setWindow] = useState<Window>('30');
  const [hover, setHover] = useState<{ weekday: number; bucket: number } | null>(null);

  const scoped = useMemo(
    () => expensesLastNDays(expenses, Number(window)),
    [expenses, window]
  );

  const cells = useMemo(() => spendingHeat(scoped), [scoped]);
  const max = useMemo(() => Math.max(...cells.map((c) => c.total), 1), [cells]);
  const total = useMemo(() => sum(scoped), [scoped]);

  const hottest = useMemo(() => [...cells].sort((a, b) => b.total - a.total)[0], [cells]);

  const cellAt = (weekday: number, bucket: number) =>
    cells.find((c) => c.weekday === weekday && c.bucket === bucket);

  const active = hover ? cellAt(hover.weekday, hover.bucket) : null;

  const intensity = (value: number) => {
    if (value === 0) return 0;
    // Square root keeps mid-range cells visible instead of washing them out.
    return Math.max(0.14, Math.sqrt(value / max));
  };

  return (
    <Panel>
      <PanelHeader
        title="Paisa wasting map"
        subtitle="When your money actually leaves"
        icon={<Flame className="h-3.5 w-3.5" />}
        action={
          <Segmented
            options={[
              { value: '30', label: '30d' },
              { value: '90', label: '90d' },
            ]}
            value={window}
            onChange={setWindow}
          />
        }
      />

      {scoped.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title="No spending to map yet"
          description="Once you have logged a week or so, this grid shows the exact days and hours your money disappears."
        />
      ) : (
        <PanelBody className="space-y-3">
          <div className="flex gap-1.5">
            {/* Row labels */}
            <div className="flex flex-col justify-end gap-1 pb-5">
              {TIME_BUCKETS.map((bucket) => (
                <div key={bucket.key} className="flex h-8 items-center">
                  <span className="w-16 text-2xs leading-tight text-faint">
                    {bucket.label}
                    <span className="block text-[9px] opacity-70">{bucket.hint}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1">
                {TIME_BUCKETS.map((bucket, bucketIndex) => (
                  <div key={bucket.key} className="flex gap-1">
                    {DAYS.map((_, weekday) => {
                      const cell = cellAt(weekday, bucketIndex);
                      const value = cell?.total ?? 0;
                      const alpha = intensity(value);
                      const isHottest =
                        hottest && hottest.total > 0 && cell === hottest;
                      return (
                        <button
                          key={weekday}
                          onMouseEnter={() => setHover({ weekday, bucket: bucketIndex })}
                          onMouseLeave={() => setHover(null)}
                          className={cn(
                            'relative h-8 flex-1 rounded-[4px] border transition-all duration-150',
                            value > 0
                              ? 'border-transparent hover:ring-1 hover:ring-negative/50'
                              : 'border-line bg-surface hover:bg-line',
                            isHottest && 'ring-1 ring-negative'
                          )}
                          style={
                            value > 0
                              ? { backgroundColor: `rgb(var(--negative) / ${alpha})` }
                              : undefined
                          }
                          aria-label={`${FULL_DAYS[weekday]} ${bucket.label}: ${formatCurrency(value)}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-1.5 flex gap-1">
                {DAYS.map((day) => (
                  <span key={day} className="flex-1 text-center text-2xs text-faint">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Readout */}
          <div className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2">
            {active && hover ? (
              <>
                <div>
                  <p className="text-xs font-medium text-ink">
                    {FULL_DAYS[hover.weekday]} · {TIME_BUCKETS[hover.bucket].label}
                  </p>
                  <p className="text-2xs text-faint">
                    {active.count} {active.count === 1 ? 'transaction' : 'transactions'}
                    {total > 0 && ` · ${Math.round((active.total / total) * 100)}% of ${window}d spend`}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabnum text-ink">
                  {formatCurrency(active.total)}
                </p>
              </>
            ) : hottest && hottest.total > 0 ? (
              <>
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-negative" />
                  <p className="text-xs leading-snug text-muted">
                    Your worst window is{' '}
                    <span className="font-semibold text-ink">
                      {FULL_DAYS[hottest.weekday]} {TIME_BUCKETS[hottest.bucket].label.toLowerCase()}
                    </span>{' '}
                    — {formatCurrency(hottest.total)} across {hottest.count}{' '}
                    {hottest.count === 1 ? 'purchase' : 'purchases'}.
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-1 text-2xs text-faint sm:flex">
                  <span>Low</span>
                  {[0.15, 0.4, 0.7, 1].map((a) => (
                    <span
                      key={a}
                      className="h-2.5 w-2.5 rounded-[2px]"
                      style={{ backgroundColor: `rgb(var(--negative) / ${a})` }}
                    />
                  ))}
                  <span>High</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted">Hover any cell to see the detail.</p>
            )}
          </div>
        </PanelBody>
      )}
    </Panel>
  );
};
