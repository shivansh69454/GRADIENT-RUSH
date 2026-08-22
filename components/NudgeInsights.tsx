'use client';

import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { Panel, PanelBody, PanelHeader, EmptyState } from '@/components/ui/Panel';
import { useApp } from '@/contexts/AppContext';
import type { InsightTone } from '@/types';
import { cn } from '@/lib/utils';

const TONE: Record<InsightTone, { border: string; tint: string; chip: string }> = {
  danger: { border: 'border-l-negative', tint: 'bg-negative/[0.05]', chip: 'chip-negative' },
  warning: { border: 'border-l-warning', tint: 'bg-warning/[0.05]', chip: 'chip-warning' },
  positive: { border: 'border-l-positive', tint: 'bg-positive/[0.05]', chip: 'chip-positive' },
  neutral: { border: 'border-l-line-strong', tint: '', chip: '' },
};

/**
 * The Nudge Engine surface. Every card is generated from the user's own numbers,
 * so there is no static copy here to go stale.
 */
export const NudgeInsights: React.FC = () => {
  const { insights, dismissInsight } = useApp();

  return (
    <Panel>
      <PanelHeader
        title="Insights"
        subtitle="Patterns Smartwise found in your spending"
        icon={<Lightbulb className="h-3.5 w-3.5" />}
        action={
          insights.length > 0 ? (
            <span className="chip">{insights.length}</span>
          ) : undefined
        }
      />

      {insights.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No new patterns"
          description="Log a few more expenses and Smartwise will surface what it notices — category leaks, weekend habits, and where your money actually goes."
        />
      ) : (
        <div className="divide-y divide-line">
          {insights.map((insight) => {
            const tone = TONE[insight.tone];
            return (
              <article
                key={insight.id}
                className={cn(
                  'group relative border-l-2 px-4 py-3 transition-colors',
                  tone.border,
                  tone.tint
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 text-base leading-none">{insight.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="pr-6 text-sm font-medium leading-snug text-ink">
                      {insight.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{insight.body}</p>
                    {insight.action && (
                      <span className={cn('chip mt-2', tone.chip)}>{insight.action}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismissInsight(insight.id)}
                  aria-label="Dismiss insight"
                  className="absolute right-3 top-3 rounded p-1 text-faint opacity-0 transition-all hover:bg-elevated hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
};
