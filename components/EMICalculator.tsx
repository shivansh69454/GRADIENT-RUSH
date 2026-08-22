'use client';

import React, { useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Slider } from '@/components/ui/Field';
import { Donut } from '@/components/ui/Charts';
import { formatCurrency } from '@/lib/utils';

export const EMICalculator: React.FC = () => {
  const [principal, setPrincipal] = useState(300000);
  const [rate, setRate] = useState(10.5);
  const [years, setYears] = useState(5);

  const { emi, totalInterest, total } = useMemo(() => {
    const months = years * 12;
    const monthlyRate = rate / 12 / 100;
    const value =
      monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);
    const totalPaid = value * months;
    return { emi: value, totalInterest: totalPaid - principal, total: totalPaid };
  }, [principal, rate, years]);

  const interestShare = total > 0 ? totalInterest / total : 0;

  return (
    <Panel>
      <PanelHeader
        title="EMI calculator"
        subtitle="What a loan really costs you"
        icon={<Landmark className="h-3.5 w-3.5" />}
      />
      <PanelBody className="space-y-5">
        <div className="flex items-center gap-5">
          <Donut
            data={[
              { label: 'Principal', value: principal, color: 'rgb(var(--accent))' },
              { label: 'Interest', value: totalInterest, color: 'rgb(var(--negative))' },
            ]}
            size={116}
            thickness={13}
          >
            <p className="eyebrow">Monthly</p>
            <p className="text-sm font-semibold tabnum text-ink">{formatCurrency(emi)}</p>
          </Donut>

          <div className="min-w-0 flex-1 space-y-2">
            {[
              { label: 'Principal', value: principal, color: 'rgb(var(--accent))' },
              { label: 'Total interest', value: totalInterest, color: 'rgb(var(--negative))' },
              { label: 'Total payable', value: total, color: 'transparent' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                {row.color !== 'transparent' ? (
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: row.color }}
                  />
                ) : (
                  <span className="h-2 w-2 shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate text-xs text-muted">{row.label}</span>
                <span className="shrink-0 text-xs font-semibold tabnum text-ink">
                  {formatCurrency(row.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Loan amount</span>
              <span className="text-xs font-semibold tabnum text-ink">
                {formatCurrency(principal)}
              </span>
            </div>
            <Slider
              min={10000}
              max={5000000}
              step={10000}
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Interest rate</span>
              <span className="text-xs font-semibold tabnum text-ink">{rate}% p.a.</span>
            </div>
            <Slider
              min={4}
              max={36}
              step={0.25}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Tenure</span>
              <span className="text-xs font-semibold tabnum text-ink">
                {years} {years === 1 ? 'year' : 'years'}
              </span>
            </div>
            <Slider
              min={1}
              max={30}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            />
          </div>
        </div>

        <p className="rounded-lg border border-line bg-surface px-3 py-2 text-2xs leading-relaxed text-muted">
          {interestShare > 0.4 ? (
            <>
              <span className="font-semibold text-negative">
                {Math.round(interestShare * 100)}% of what you repay is pure interest.
              </span>{' '}
              At this rate and tenure the bank earns {formatCurrency(totalInterest)} on a{' '}
              {formatCurrency(principal)} loan. Shortening the tenure cuts that hard.
            </>
          ) : (
            <>
              Interest is {Math.round(interestShare * 100)}% of your total repayment. Keep total
              EMIs under 40% of monthly income and this stays comfortable.
            </>
          )}
        </p>
      </PanelBody>
    </Panel>
  );
};

export default EMICalculator;
