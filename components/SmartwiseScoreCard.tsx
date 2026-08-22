'use client';

import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Bot, Minus, Sparkles } from 'lucide-react';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { AnimatedNumber, ProgressBar, RadialGauge } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { explainScore } from '@/lib/ai';
import { weakestPillar } from '@/lib/smartwiseScore';
import { cn } from '@/lib/utils';

const BAND_COLOR = {
  negative: 'rgb(var(--negative))',
  warning: 'rgb(var(--warning))',
  positive: 'rgb(var(--positive))',
} as const;

const BAND_TEXT = {
  negative: 'text-negative',
  warning: 'text-warning',
  positive: 'text-positive',
} as const;

export const SmartwiseScoreCard: React.FC = () => {
  const { smartwiseScore, aiContext } = useApp();
  const [explanation, setExplanation] = useState<{ text: string; live: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const weakest = weakestPillar(smartwiseScore);

  const runExplain = async () => {
    setLoading(true);
    const result = await explainScore(aiContext);
    setExplanation({ text: result.text, live: result.live });
    setLoading(false);
  };

  const DeltaIcon =
    smartwiseScore.delta > 0 ? ArrowUpRight : smartwiseScore.delta < 0 ? ArrowDownRight : Minus;

  return (
    <Panel>
      <PanelHeader
        title="Smartwise Score"
        subtitle="Your financial health, out of 100"
        icon={<Sparkles className="h-3.5 w-3.5" />}
        action={
          <span
            className={cn(
              'chip',
              smartwiseScore.band === 'positive' && 'chip-positive',
              smartwiseScore.band === 'warning' && 'chip-warning',
              smartwiseScore.band === 'negative' && 'chip-negative'
            )}
          >
            {smartwiseScore.grade}
          </span>
        }
      />

      <PanelBody className="space-y-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative shrink-0">
            <RadialGauge
              value={smartwiseScore.score}
              size={156}
              thickness={9}
              color={BAND_COLOR[smartwiseScore.band]}
            >
              <AnimatedNumber
                value={smartwiseScore.score}
                duration={1100}
                className="text-4xl font-semibold tracking-tight text-ink"
              />
              <p className="mt-0.5 text-2xs text-faint">out of 100</p>
              {smartwiseScore.delta !== 0 && (
                <span
                  className={cn(
                    'mt-1.5 inline-flex items-center gap-0.5 text-2xs font-semibold',
                    smartwiseScore.delta > 0 ? 'text-positive' : 'text-negative'
                  )}
                >
                  <DeltaIcon className="h-3 w-3" />
                  {Math.abs(smartwiseScore.delta)} this week
                </span>
              )}
            </RadialGauge>
          </div>

          <div className="w-full min-w-0 flex-1 space-y-2.5">
            {smartwiseScore.pillars.map((pillar) => (
              <div key={pillar.key} className="group space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs font-medium text-ink">{pillar.label}</span>
                  <span className="shrink-0 text-2xs tabnum text-faint">
                    {Math.round(pillar.points)}/{pillar.weight}
                  </span>
                </div>
                <ProgressBar
                  value={pillar.ratio * 100}
                  height={4}
                  barClassName={
                    pillar.ratio >= 0.7
                      ? 'bg-positive'
                      : pillar.ratio >= 0.4
                        ? 'bg-warning'
                        : 'bg-negative'
                  }
                />
                <p className="text-2xs leading-tight text-faint">{pillar.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {!smartwiseScore.hasEnoughData && (
          <p className="rounded-lg border border-line bg-surface px-3 py-2 text-2xs leading-relaxed text-muted">
            Your score is provisional. Set a monthly allowance and log at least three expenses for
            a reading you can trust.
          </p>
        )}

        {explanation ? (
          <div className="space-y-2 rounded-lg border border-line bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
                <Bot className="h-3.5 w-3.5 text-accent" />
                Coach breakdown
              </span>
              <span className={explanation.live ? 'chip chip-positive' : 'chip'}>
                {explanation.live ? 'Gemini' : 'Offline'}
              </span>
            </div>
            <p className="whitespace-pre-line text-xs leading-relaxed text-muted">
              {explanation.text}
            </p>
            <Button variant="ghost" size="sm" onClick={runExplain} loading={loading}>
              Ask again
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3">
            <p className="min-w-0 text-xs text-muted">
              Weakest pillar right now is{' '}
              <span className="font-medium text-ink">{weakest.label.toLowerCase()}</span>.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={runExplain}
              loading={loading}
              icon={<Bot className="h-3.5 w-3.5" />}
              className="shrink-0"
            >
              Explain my score
            </Button>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
};
