'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FieldShell: React.FC<FieldShellProps> = ({
  label,
  hint,
  error,
  children,
  className,
}) => (
  <div className={cn('space-y-1.5', className)}>
    {label && <label className="block text-xs font-medium text-muted">{label}</label>}
    {children}
    {error ? (
      <p className="text-2xs text-negative">{error}</p>
    ) : (
      hint && <p className="text-2xs text-faint">{hint}</p>
    )}
  </div>
);

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { large?: boolean }
>(({ className, large, ...rest }, ref) => (
  <input ref={ref} className={cn('field', large && 'field-lg', className)} {...rest} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cn('field', className)} {...rest} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <select ref={ref} className={cn('field cursor-pointer pr-8', className)} {...rest}>
    {children}
  </select>
));
Select.displayName = 'Select';

/** Amount input with a permanent rupee affordance so users never type "₹". */
export const MoneyInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { large?: boolean }
> = ({ className, large, ...rest }) => (
  <div className="relative">
    <span
      className={cn(
        'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted',
        large ? 'text-base' : 'text-sm'
      )}
    >
      ₹
    </span>
    <input
      type="number"
      inputMode="decimal"
      className={cn('field pl-7 tabnum', large && 'field-lg pl-8', className)}
      {...rest}
    />
  </div>
);

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  min: number;
  max: number;
}

/** Range input that paints its own filled track via a CSS custom property. */
export const Slider: React.FC<SliderProps> = ({ className, min, max, value, ...rest }) => {
  const progress = ((Number(value) - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      className={cn('w-full', className)}
      style={{ '--range-progress': `${progress}%` } as React.CSSProperties}
      {...rest}
    />
  );
};

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        'glass inline-flex items-center gap-0.5 rounded-xl p-0.5',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
            value === option.value
              ? 'bg-accent text-white shadow-sm'
              : 'text-muted hover:text-ink hover:bg-white/10'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
