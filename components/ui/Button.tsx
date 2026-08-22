'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const SIZES: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  ...rest
}) => (
  <button
    className={cn(VARIANTS[variant], SIZES[size], className)}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
    {children}
    {!loading && iconRight}
  </button>
);

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
> = ({ label, className, children, ...rest }) => (
  <button
    aria-label={label}
    title={label}
    className={cn(
      'icon-btn inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-ink',
      'disabled:pointer-events-none disabled:opacity-40',
      className
    )}
    {...rest}
  >
    {children}
  </button>
);
