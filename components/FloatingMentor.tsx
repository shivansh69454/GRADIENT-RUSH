'use client';

import React, { useState } from 'react';
import { Bot, Maximize2, X } from 'lucide-react';
import Link from 'next/link';
import { AIMentorChat } from '@/components/AIMentorChat';
import { IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const FloatingMentor: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="glass-strong fixed bottom-[76px] right-4 z-[70] flex h-[520px] max-h-[calc(100vh-120px)] w-[calc(100vw-2rem)] max-w-[380px] animate-scale-in flex-col overflow-hidden rounded-2xl sm:right-6">
          <header className="flex items-center justify-between gap-2 border-b border-line/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/12">
                <Bot className="h-3.5 w-3.5 text-accent" />
              </span>
              <div>
                <p className="text-xs font-semibold leading-tight text-ink">Smartwise AI</p>
                <p className="text-2xs leading-tight text-faint">Knows your numbers</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <Link href="/mentor" onClick={() => setOpen(false)}>
                <IconButton label="Open full page">
                  <Maximize2 className="h-3.5 w-3.5" />
                </IconButton>
              </Link>
              <IconButton label="Close" onClick={() => setOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          </header>
          <AIMentorChat compact />
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close AI mentor' : 'Open AI mentor'}
        className={cn(
          'fixed bottom-4 right-4 z-[70] flex h-12 items-center gap-2 rounded-full px-5',
          'transition-all duration-200 active:scale-95 sm:right-6',
          open
            ? 'glass text-muted'
            : 'bg-accent text-white hover:bg-accent-hover'
        )}
        style={
          open
            ? undefined
            : {
                boxShadow:
                  '0 4px 20px rgb(var(--accent) / 0.45), 0 2px 8px rgb(0 0 0 / 0.15), inset 0 1px 0 rgb(255 255 255 / 0.2)',
              }
        }
      >
        {open ? <X className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        <span className="text-sm font-medium">{open ? 'Close' : 'Ask AI'}</span>
      </button>
    </>
  );
};

export default FloatingMentor;
