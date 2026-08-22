'use client';

import React, { useMemo, useState } from 'react';
import { PiggyBank } from 'lucide-react';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Slider } from '@/components/ui/Field';
import { AnimatedNumber, Donut } from '@/components/ui/Charts';
import { formatCurrency } from '@/lib/utils';

export const SIPCalculator: React.FC = () => {
  const [monthly, setMonthly] = useState(2000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const { value, invested, growth } = useMemo(() => {
    const months = years * 12;
    const r = rate / 12 / 100;
    const fv = r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
    const put = monthly * months;
    return { value: fv, invested: put, growth: fv - put };
  }, [monthly, rate, years]);

  return (
    <Panel>
      <PanelHeader
        title="SIP calculator"
        subtitle="What a monthly habit compounds into"
        icon={<PiggyBank className="h-3.5 w-3.5" />}
      />
      <PanelBody className="space-y-5">
        <div className="flex items-center gap-5">
          <Donut
            data={[
              { label: 'Invested', value: invested, color: 'rgb(var(--accent))' },
              { label: 'Growth', value: growth, color: 'rgb(var(--positive))' },
            ]}
            size={116}
            thickness={13}
          >
            <p className="eyebrow">Value</p>
            <p className="text-sm font-semibold tabnum text-ink">{formatCurrency(value, true)}</p>
          </Donut>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="eyebrow">After {years} years</p>
              <p className="metric text-2xl">
                <AnimatedNumber value={value} format={(n) => formatCurrency(n)} />
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm bg-accent" />
                <span className="flex-1 text-xs text-muted">You invest</span>
                <span className="text-xs font-semibold tabnum text-ink">
                  {formatCurrency(invested)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm bg-positive" />
                <span className="flex-1 text-xs text-muted">Compounding adds</span>
                <span className="text-xs font-semibold tabnum text-positive">
                  {formatCurrency(growth)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Monthly investment</span>
              <span className="text-xs font-semibold tabnum text-ink">
                {formatCurrency(monthly)}
              </span>
            </div>
            <Slider
              min={100}
              max={50000}
              step={100}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Expected return</span>
              <span className="text-xs font-semibold tabnum text-ink">{rate}% p.a.</span>
            </div>
            <Slider
              min={4}
              max={20}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Duration</span>
              <span className="text-xs font-semibold tabnum text-ink">
                {years} {years === 1 ? 'year' : 'years'}
              </span>
            </div>
            <Slider
              min={1}
              max={40}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            />
          </div>
        </div>

        <p className="rounded-lg border border-line bg-surface px-3 py-2 text-2xs leading-relaxed text-muted">
          {growth > invested ? (
            <>
              Past year {Math.ceil(years / 2)}, compounding contributes more than your own
              deposits — <span className="font-semibold text-positive">
                {Math.round((growth / value) * 100)}%
              </span>{' '}
              of the final amount is growth. Time in the market is doing the work, not the amount.
            </>
          ) : (
            <>
              Stretch the duration slider. The same {formatCurrency(monthly)} a month becomes{' '}
              <span className="font-semibold text-ink">
                {formatCurrency(
                  monthly * ((Math.pow(1 + rate / 1200, 240) - 1) / (rate / 1200)) * (1 + rate / 1200),
                  true
                )}
              </span>{' '}
              over 20 years.
            </>
          )}
        </p>
      </PanelBody>
    </Panel>
  );
};

export default SIPCalculator;
