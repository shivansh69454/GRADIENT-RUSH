'use client';

import React, { useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { getLevelDiscount } from '@/lib/utils';

/**
 * Full-screen level-up moment. Confetti is fired from the context the instant
 * the level changes; this is the card that lands underneath it.
 */
export const LevelUpOverlay: React.FC = () => {
  const { levelUp, clearLevelUp } = useApp();

  useEffect(() => {
    if (!levelUp) return;
    const timer = setTimeout(clearLevelUp, 7000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearLevelUp();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
    };
  }, [levelUp, clearLevelUp]);

  if (!levelUp) return null;

  const discount = getLevelDiscount(levelUp.level);
  const titleChanged = levelUp.title !== levelUp.previousTitle;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
        onClick={clearLevelUp}
      />

      <div className="relative z-10 w-full max-w-sm animate-scale-in overflow-hidden rounded-2xl border border-line bg-elevated shadow-xl">
        <div className="relative overflow-hidden border-b border-line bg-surface px-6 pb-6 pt-8 text-center">
          <div className="pointer-events-none absolute inset-0 grid-noise opacity-40" />

          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent/30" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/12 text-2xl font-bold tabnum text-accent">
              {levelUp.level}
            </span>
          </div>

          <p className="eyebrow relative">Level up</p>
          <h2 className="relative mt-1 text-2xl font-semibold text-ink">
            You reached level {levelUp.level}
          </h2>

          {titleChanged ? (
            <div className="relative mt-3 inline-flex items-center gap-2 rounded-lg border border-line bg-elevated px-3 py-1.5 text-xs">
              <span className="text-faint line-through">{levelUp.previousTitle}</span>
              <ArrowRight className="h-3 w-3 text-muted" />
              <span className="font-semibold text-ink">{levelUp.title}</span>
            </div>
          ) : (
            <p className="relative mt-2 text-sm text-muted">{levelUp.title}</p>
          )}
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-xs leading-relaxed text-muted">
              {discount > 0 ? (
                <>
                  You have unlocked <span className="font-semibold text-ink">{discount}% off</span>{' '}
                  every course in the library. Next discount tier at level{' '}
                  {(Math.floor(levelUp.level / 20) + 1) * 20}.
                </>
              ) : (
                <>
                  Reach level 20 to unlock <span className="font-semibold text-ink">5% off</span>{' '}
                  every course. Keep your logging streak alive for multiplied XP.
                </>
              )}
            </p>
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={clearLevelUp}>
            Keep going
          </Button>
        </div>
      </div>
    </div>
  );
};
