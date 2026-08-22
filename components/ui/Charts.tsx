'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn, clamp, formatCurrency } from '@/lib/utils';

// ------------------------------------------------------------- animated number

/** Counts up to `value`, which makes XP and rupee changes feel earned. */
export const AnimatedNumber: React.FC<{
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}> = ({ value, format = (n) => Math.round(n).toString(), duration = 700, className }) => {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();

    const tick = (now: number) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = value;
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return <span className={cn('tabnum', className)}>{format(display)}</span>;
};

// ---------------------------------------------------------------- radial gauge

interface GaugeProps {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackClassName?: string;
  children?: React.ReactNode;
  /** Leaves a gap at the bottom so the arc reads as a gauge, not a ring. */
  gap?: number;
}

export const RadialGauge: React.FC<GaugeProps> = ({
  value,
  max = 100,
  size = 168,
  thickness = 10,
  color = 'rgb(var(--accent))',
  trackClassName,
  children,
  gap = 0.24,
}) => {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * (1 - gap);
  const ratio = clamp(value / max, 0, 1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(ratio));
    return () => cancelAnimationFrame(id);
  }, [ratio]);

  const rotation = 90 + (gap * 360) / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Rotated so the gap sits centred at the bottom, reading as a gauge. */}
      <svg width={size} height={size} style={{ transform: `rotate(${rotation}deg)` }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
          className={cn('stroke-line', trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${arc * progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};

// ------------------------------------------------------------------ progress

export const ProgressBar: React.FC<{
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  height?: number;
}> = ({ value, max = 100, className, barClassName, height = 5 }) => {
  const pct = clamp((value / (max || 1)) * 100, 0, 100);
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-line', className)}
      style={{ height }}
    >
      <div
        className={cn('h-full rounded-full bg-accent', barClassName)}
        style={{ width: `${pct}%`, transition: 'width 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </div>
  );
};

// ------------------------------------------------------------------- donut

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export const Donut: React.FC<{
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
  onHover?: (slice: DonutSlice | null) => void;
}> = ({ data, size = 132, thickness = 14, children, onHover }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  let offset = 0;

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {total === 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={thickness}
            className="stroke-line"
          />
        )}
        {data.map((slice) => {
          const share = total > 0 ? slice.value / total : 0;
          const length = circumference * share;
          const dash = mounted ? length : 0;
          const element = (
            <circle
              key={slice.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="cursor-pointer transition-opacity hover:opacity-80"
              style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1)' }}
              onMouseEnter={() => onHover?.(slice)}
              onMouseLeave={() => onHover?.(null)}
            />
          );
          offset += mounted ? length : 0;
          return element;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};

// --------------------------------------------------------------- bar series

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
  sublabel?: string;
}

export const BarSeries: React.FC<{
  data: BarDatum[];
  height?: number;
  formatValue?: (n: number) => string;
  className?: string;
}> = ({ data, height = 120, formatValue = (n) => formatCurrency(n, true), className }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={cn('flex items-end gap-1.5', className)} style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={`${d.label}-${i}`} className="group relative flex flex-1 flex-col items-center gap-1.5">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className={cn(
                  'w-full rounded-t-[3px] transition-all duration-700 ease-swift',
                  d.highlight ? 'bg-accent' : 'bg-line-strong group-hover:bg-muted'
                )}
                style={{
                  height: mounted ? `${Math.max(pct, d.value > 0 ? 3 : 0)}%` : '0%',
                  transitionDelay: `${i * 45}ms`,
                }}
              />
              {d.value > 0 && (
                <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-overlay px-1.5 py-0.5 text-2xs font-medium text-ink opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  {formatValue(d.value)}
                </span>
              )}
            </div>
            <span className="text-2xs text-faint">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------------- sparkline

export const Sparkline: React.FC<{
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  className?: string;
}> = ({ values, width = 120, height = 32, color = 'rgb(var(--accent))', fill = true, className }) => {
  if (values.length < 2) return <div style={{ width, height }} className={className} />;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const line = `M ${points.join(' L ')}`;
  const area = `${line} L ${width},${height} L 0,${height} Z`;
  const gradientId = `spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// ---------------------------------------------------------------- fan chart

export interface FanBand {
  month: number;
  p10: number;
  p50: number;
  p90: number;
}

/**
 * Uncertainty cone for the Monte Carlo forecast: a shaded p10–p90 band with the
 * median drawn through it. The band is the point — a single line would imply a
 * confidence the simulation does not actually have.
 */
export const FanChart: React.FC<{
  bands: FanBand[];
  target?: number;
  height?: number;
  color?: string;
  labelFor?: (month: number) => string;
}> = ({ bands, target, height = 210, color = 'rgb(var(--accent))', labelFor }) => {
  const width = 560;
  const padding = { top: 14, right: 10, bottom: 24, left: 48 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(...bands.map((b) => b.p90), target ?? 0, 1) * 1.05;
  const count = bands.length;
  const step = count > 1 ? innerW / (count - 1) : innerW;

  const x = (i: number) => padding.left + i * step;
  const y = (value: number) => padding.top + innerH - (value / max) * innerH;

  const upper = bands.map((b, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(b.p90).toFixed(1)}`);
  const lower = [...bands]
    .reverse()
    .map((b, i) => `L ${x(count - 1 - i).toFixed(1)} ${y(b.p10).toFixed(1)}`);
  const bandPath = `${upper.join(' ')} ${lower.join(' ')} Z`;

  const medianPath = bands
    .map((b, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(b.p50).toFixed(1)}`)
    .join(' ');

  const ticks = [0, 0.5, 1].map((t) => t * max);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {ticks.map((tick, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y(tick)}
            y2={y(tick)}
            className="stroke-line"
            strokeWidth="1"
            strokeDasharray={i === 0 ? '0' : '3 4'}
          />
          <text x={padding.left - 8} y={y(tick) + 3} textAnchor="end" className="fill-faint text-[9px]">
            {formatCurrency(tick, true)}
          </text>
        </g>
      ))}

      <path d={bandPath} fill={color} fillOpacity="0.16" />
      <path
        d={medianPath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {target !== undefined && target <= max && (
        <g>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y(target)}
            y2={y(target)}
            stroke="rgb(var(--positive))"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
          <text
            x={width - padding.right}
            y={y(target) - 5}
            textAnchor="end"
            className="fill-positive text-[9px] font-medium"
          >
            Target {formatCurrency(target, true)}
          </text>
        </g>
      )}

      {bands.map((b, i) => {
        const showEvery = Math.max(1, Math.ceil(count / 6));
        if (i % showEvery !== 0 && i !== count - 1) return null;
        return (
          <text
            key={b.month}
            x={x(i)}
            y={height - 7}
            textAnchor="middle"
            className="fill-faint text-[9px]"
          >
            {labelFor ? labelFor(b.month) : `${b.month}m`}
          </text>
        );
      })}
    </svg>
  );
};

// --------------------------------------------------------------- area chart

export const AreaChart: React.FC<{
  series: { label: string; values: number[]; color: string }[];
  labels: string[];
  height?: number;
  formatValue?: (n: number) => string;
}> = ({ series, labels, height = 200, formatValue = (n) => formatCurrency(n, true) }) => {
  const width = 560;
  const padding = { top: 12, right: 8, bottom: 22, left: 44 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(...allValues, 1);
  const count = Math.max(...series.map((s) => s.values.length), 1);
  const step = count > 1 ? innerW / (count - 1) : innerW;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);

  const pathFor = (values: number[]) =>
    values
      .map((v, i) => {
        const x = padding.left + i * step;
        const y = padding.top + innerH - (v / max) * innerH;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {ticks.map((tick, i) => {
        const y = padding.top + innerH - (tick / max) * innerH;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              className="stroke-line"
              strokeWidth="1"
              strokeDasharray={i === 0 ? '0' : '3 4'}
            />
            <text x={padding.left - 8} y={y + 3} textAnchor="end" className="fill-faint text-[9px]">
              {formatValue(tick)}
            </text>
          </g>
        );
      })}

      {series.map((s) => {
        const gradientId = `area-${s.label.replace(/\s/g, '')}`;
        const d = pathFor(s.values);
        const last = s.values.length - 1;
        const closing = `${d} L ${(padding.left + last * step).toFixed(1)} ${padding.top + innerH} L ${padding.left} ${padding.top + innerH} Z`;
        return (
          <g key={s.label}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={closing} fill={`url(#${gradientId})`} />
            <path
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {labels.map((label, i) => {
        if (count > 8 && i % Math.ceil(count / 6) !== 0 && i !== count - 1) return null;
        return (
          <text
            key={i}
            x={padding.left + i * step}
            y={height - 6}
            textAnchor="middle"
            className="fill-faint text-[9px]"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};
