'use client';

import React from 'react';
import { AlertTriangle, Check, Info, Sparkles, X, Zap } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import type { ToastVariant } from '@/types';
import { cn } from '@/lib/utils';

const STYLES: Record<ToastVariant, { ring: string; icon: React.ReactNode; tint: string }> = {
  xp: {
    ring: 'ring-accent/30',
    tint: 'bg-accent/10 text-accent',
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  success: {
    ring: 'ring-positive/30',
    tint: 'bg-positive/10 text-positive',
    icon: <Check className="h-3.5 w-3.5" />,
  },
  warning: {
    ring: 'ring-warning/30',
    tint: 'bg-warning/12 text-warning',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  danger: {
    ring: 'ring-negative/30',
    tint: 'bg-negative/12 text-negative',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  info: {
    ring: 'ring-line-strong',
    tint: 'bg-surface text-muted',
    icon: <Info className="h-3.5 w-3.5" />,
  },
};

export const ToastHost: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      {toasts.map((toast) => {
        const style = STYLES[toast.variant];
        return (
          <div
            key={toast.id}
            className={cn(
              'glass pointer-events-auto flex animate-toast-in items-start gap-2.5 rounded-xl p-3 ring-1',
              style.ring
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                style.tint
              )}
            >
              {toast.icon ? <span className="text-xs">{toast.icon}</span> : style.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-ink">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs leading-snug text-muted">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="-mr-1 -mt-1 rounded p-1 text-faint transition-colors hover:text-ink"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

/** Floating "+50 XP" that rises out of the button that earned it. */
export const XPFloat: React.FC<{ amount: number }> = ({ amount }) => (
  <span className="pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 animate-xp-float whitespace-nowrap text-xs font-bold text-accent">
    <Sparkles className="mr-0.5 inline h-3 w-3" />
    +{amount} XP
  </span>
);
