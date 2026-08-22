'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Download,
  Image as ImageIcon,
  Loader2,
  ScanLine,
  Upload,
  X,
} from 'lucide-react';
import { Panel, PanelBody, PanelHeader, EmptyState } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { parseStatementText, statementStats } from '@/lib/statement';
import { CATEGORIES, detectEmoji } from '@/lib/categories';
import type { StatementRow } from '@/types';
import { cn, formatCurrency, formatShortDate } from '@/lib/utils';

type Stage = 'idle' | 'reading' | 'done' | 'error';

const XP_PER_ROW = 40;

/**
 * A whole payment history, in one paste.
 *
 * The single-transaction flows all assume you already know what you spent. This
 * one starts from where people actually are: they open GPay, screenshot the
 * list, and want it in the app. Cmd+V of a screenshot is the fast path — OCR
 * runs on-device, so a full month of history costs nothing and uploads nowhere.
 */
export const StatementImport: React.FC = () => {
  const { logExpenses, awardXP, pushToast } = useApp();

  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [rawText, setRawText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const [imported, setImported] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const revoke = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => revoke, [revoke]);

  const reset = () => {
    revoke();
    setStage('idle');
    setProgress(0);
    setPreview(null);
    setRows([]);
    setRawText('');
    setErrorMessage('');
    setSelected(new Set());
    setOverrides({});
  };

  const runOcr = useCallback(
    async (file: File) => {
      revoke();
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;

      setPreview(url);
      setStage('reading');
      setProgress(0);
      setRows([]);
      setSelected(new Set());
      setOverrides({});

      try {
        const { default: Tesseract } = await import('tesseract.js');
        const result = await Tesseract.recognize(file, 'eng', {
          logger: (message: { status: string; progress: number }) => {
            if (message.status === 'recognizing text') {
              setProgress(Math.round(message.progress * 100));
            }
          },
        });

        const text = result.data.text ?? '';
        const parsed = parseStatementText(text);

        setRawText(text);
        setRows(parsed);
        // Pre-select the confident debits; credits are never imported.
        setSelected(
          new Set(
            parsed
              .filter((r) => r.direction === 'debit' && r.confidence >= 0.6)
              .map((r) => r.id)
          )
        );
        setStage('done');
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `Could not read that image: ${error.message}`
            : 'Could not read that image.'
        );
        setStage('error');
      }
    },
    [revoke]
  );

  // Cmd/Ctrl+V anywhere on the page — the fastest route from phone to ledger.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const image = items.find((item) => item.type.startsWith('image/'));
      if (!image) return;
      const file = image.getAsFile();
      if (!file) return;
      event.preventDefault();
      void runOcr(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [runOcr]);

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = Array.from(event.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) void runOcr(file);
  };

  const debits = useMemo(() => rows.filter((r) => r.direction === 'debit'), [rows]);
  const stats = useMemo(() => statementStats(rows), [rows]);

  const chosen = debits.filter((r) => selected.has(r.id));
  const chosenTotal = chosen.reduce((acc, r) => acc + r.amount, 0);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const runImport = () => {
    if (chosen.length === 0) return;

    logExpenses(
      chosen.map((row) => ({
        amount: row.amount,
        description: row.merchant,
        category: overrides[row.id] ?? row.category,
        date: row.date,
        source: 'scan' as const,
      }))
    );

    const xp = chosen.length * XP_PER_ROW;
    awardXP(xp, `Imported ${chosen.length} rows from a screenshot`);
    pushToast({
      variant: 'success',
      icon: '🖼️',
      title: `${chosen.length} ${chosen.length === 1 ? 'row' : 'rows'} imported`,
      description: `${formatCurrency(chosenTotal)} read straight off the screenshot.`,
    });

    setImported((n) => n + chosen.length);
    reset();
  };

  return (
    <Panel>
      <PanelHeader
        title="Import a screenshot"
        subtitle="Paste your payment history — every row at once"
        icon={<ImageIcon className="h-3.5 w-3.5" />}
        action={
          stage === 'done' || stage === 'error' ? (
            <Button variant="ghost" size="sm" onClick={reset}>
              Start over
            </Button>
          ) : undefined
        }
      />

      <PanelBody className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void runOcr(file);
          }}
        />

        {stage === 'idle' && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-dashed px-4 py-9 text-center transition-all',
                dragging
                  ? 'border-accent bg-accent/6'
                  : 'border-line-strong bg-surface hover:border-accent/50 hover:bg-elevated'
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/12 text-accent">
                <ClipboardPaste className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">
                  Press{' '}
                  <kbd className="rounded border border-line bg-elevated px-1.5 py-0.5 text-2xs">
                    ⌘V
                  </kbd>{' '}
                  to paste a screenshot
                </p>
                <p className="mt-1 text-xs text-muted">
                  Or drop an image here · click to browse
                </p>
              </div>
              <p className="max-w-sm text-2xs leading-relaxed text-faint">
                Works with GPay, PhonePe, Paytm and bank statement screens. Reading happens in this
                tab with on-device OCR — the image never leaves your phone.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { step: '1', text: 'Open your payments app and screenshot the history' },
                { step: '2', text: 'Paste it here — every row is extracted at once' },
                { step: '3', text: 'Untick anything wrong, then import for XP' },
              ].map((item) => (
                <div key={item.step} className="rounded-lg border border-line bg-surface p-2.5">
                  <p className="eyebrow">Step {item.step}</p>
                  <p className="mt-0.5 text-2xs leading-relaxed text-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {stage !== 'idle' && preview && (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
            <div className="relative overflow-hidden rounded-lg border border-line bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Statement screenshot" className="max-h-56 w-full object-contain" />
              {stage === 'reading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg/80 backdrop-blur-sm">
                  <ScanLine className="h-5 w-5 animate-breathe text-accent" />
                  <div className="w-24">
                    <ProgressBar value={progress} height={3} />
                  </div>
                  <p className="text-2xs tabnum text-faint">{progress}%</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {stage === 'reading' && (
                <p className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Reading every row…
                </p>
              )}

              {stage === 'error' && (
                <div className="space-y-2 rounded-lg border border-negative/30 bg-negative/6 p-3">
                  <p className="text-xs text-negative">{errorMessage}</p>
                  <Button variant="secondary" size="sm" onClick={reset}>
                    Try another image
                  </Button>
                </div>
              )}

              {stage === 'done' && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-line bg-surface p-2.5">
                    <p className="eyebrow">Rows found</p>
                    <p className="text-lg font-semibold tabnum text-ink">{rows.length}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-surface p-2.5">
                    <p className="eyebrow">Spends</p>
                    <p className="text-lg font-semibold tabnum text-ink">{stats.debits}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-surface p-2.5">
                    <p className="eyebrow">Total</p>
                    <p className="text-lg font-semibold tabnum text-ink">
                      {formatCurrency(stats.debitTotal, true)}
                    </p>
                  </div>
                </div>
              )}

              {stage === 'done' && rows.length > 0 && (
                <details className="group rounded-lg border border-line bg-surface">
                  <summary className="cursor-pointer list-none px-3 py-2 text-2xs font-medium text-muted transition-colors hover:text-ink">
                    View raw OCR text
                  </summary>
                  <pre className="max-h-32 overflow-auto whitespace-pre-wrap border-t border-line px-3 py-2 text-[10px] leading-relaxed text-faint scrollbar-slim">
                    {rawText.trim() || 'No text detected.'}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {stage === 'done' && rows.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No transactions recognised"
            description="OCR needs readable text. Screenshot at full brightness without zooming out, and crop to just the transaction list."
            action={
              <Button variant="secondary" size="sm" onClick={reset}>
                Try another screenshot
              </Button>
            }
          />
        )}

        {rows.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="flex items-center justify-between gap-2 border-b border-line bg-surface px-3 py-2">
              <p className="text-xs font-medium text-ink">Extracted rows</p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(new Set(debits.map((r) => r.id)))}
                >
                  All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  None
                </Button>
              </div>
            </div>

            <div className="max-h-80 divide-y divide-line overflow-y-auto scrollbar-slim">
              {rows.map((row) => {
                const isCredit = row.direction === 'credit';
                const isSelected = selected.has(row.id);
                const category = overrides[row.id] ?? row.category;

                return (
                  <div
                    key={row.id}
                    className={cn(
                      'flex items-start gap-2.5 px-3 py-2.5 transition-colors',
                      isSelected && !isCredit && 'bg-accent/4'
                    )}
                  >
                    {isCredit ? (
                      <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border border-line text-faint">
                        <X className="h-3 w-3" />
                      </span>
                    ) : (
                      <button
                        onClick={() => toggle(row.id)}
                        aria-label={isSelected ? 'Deselect row' : 'Select row'}
                        className={cn(
                          'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all',
                          isSelected
                            ? 'border-accent bg-accent text-white'
                            : 'border-line-strong hover:border-accent'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </button>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="min-w-0 truncate text-sm text-ink">
                          {detectEmoji(row.merchant, category)} {row.merchant}
                        </p>
                        <p
                          className={cn(
                            'shrink-0 text-sm font-semibold tabnum',
                            isCredit ? 'text-positive' : 'text-ink'
                          )}
                        >
                          {isCredit ? '+' : '−'}
                          {formatCurrency(row.amount)}
                        </p>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={
                            row.confidence >= 0.75
                              ? 'chip chip-positive'
                              : row.confidence >= 0.55
                                ? 'chip chip-warning'
                                : 'chip chip-negative'
                          }
                        >
                          {Math.round(row.confidence * 100)}%
                        </span>
                        <span className="chip">{formatShortDate(row.date)}</span>
                        {isCredit ? (
                          <span className="chip chip-positive">Money in · skipped</span>
                        ) : (
                          <Select
                            value={category}
                            onChange={(e) => setOverrides({ ...overrides, [row.id]: e.target.value })}
                            className="h-6 w-auto py-0 text-2xs"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.emoji} {c.key}
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {chosen.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-ink">
                    {chosen.length} selected · {formatCurrency(chosenTotal)}
                  </p>
                  <p className="text-2xs text-faint">
                    Worth {chosen.length * XP_PER_ROW} XP on import
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={runImport}
                  icon={<Download className="h-3.5 w-3.5" />}
                >
                  Import {chosen.length}
                </Button>
              </div>
            )}
          </div>
        )}

        {imported > 0 && stage === 'idle' && (
          <div className="flex items-center gap-2 rounded-lg border border-positive/25 bg-positive/6 px-3 py-2.5">
            <Check className="h-4 w-4 shrink-0 text-positive" />
            <p className="text-xs text-muted">
              <span className="font-medium text-ink">{imported}</span> rows imported from screenshots
              this session.
            </p>
          </div>
        )}

        {stage === 'idle' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="h-3.5 w-3.5" />}
            className="w-full sm:hidden"
          >
            Choose a screenshot
          </Button>
        )}
      </PanelBody>
    </Panel>
  );
};
