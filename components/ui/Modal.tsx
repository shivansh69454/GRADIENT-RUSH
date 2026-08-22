'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  className,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'glass-strong relative z-10 w-full animate-scale-in overflow-hidden rounded-t-2xl sm:rounded-2xl',
          SIZES[size],
          className
        )}
      >
        {(title || subtitle) && (
          <header className="flex items-start justify-between gap-4 border-b border-line/40 px-4 py-3.5">
            <div className="min-w-0">
              {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
            </div>
            <IconButton label="Close" onClick={onClose} className="-mr-1 -mt-0.5">
              <X className="h-4 w-4" />
            </IconButton>
          </header>
        )}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-slim">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-line/40 glass-subtle px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};
