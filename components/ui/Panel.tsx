'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  /** Quiet panels sit flush on the page background — used for nested regions. */
  quiet?: boolean;
}

export const Panel: React.FC<PanelProps> = ({ children, className, quiet }) => (
  <section className={cn(quiet ? 'panel-quiet' : 'panel', 'overflow-hidden', className)}>
    {children}
  </section>
);

interface PanelHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  className,
}) => (
  <header className={cn('panel-header', className)}>
    <div className="flex min-w-0 items-center gap-2.5">
      {icon && (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted glass-subtle"
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
  </header>
);

export const PanelBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('panel-body', className)}>{children}</div>;

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
    {icon && <div className="text-2xl opacity-60">{icon}</div>}
    <p className="text-sm font-medium text-ink">{title}</p>
    {description && <p className="max-w-xs text-xs leading-relaxed text-muted">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
