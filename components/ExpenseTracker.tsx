'use client';

import React, { useMemo, useState } from 'react';
import { Camera, Mic, Plus, Trash2, Wallet } from 'lucide-react';
import { Panel, PanelBody, PanelHeader, EmptyState } from '@/components/ui/Panel';
import { Button, IconButton } from '@/components/ui/Button';
import { MoneyInput, Input, Select, Segmented } from '@/components/ui/Field';
import { AnimatedNumber, Donut } from '@/components/ui/Charts';
import { VoiceExpenseCapture } from '@/components/VoiceExpenseCapture';
import { BillScanner } from '@/components/BillScanner';
import { useApp } from '@/contexts/AppContext';
import { byCategory, expensesOn, expensesThisWeek, sum } from '@/lib/analytics';
import { CATEGORIES, detectCategory, detectEmoji } from '@/lib/categories';
import { cn, formatCurrency, getTodayDate } from '@/lib/utils';

type Range = 'today' | 'week';

const SOURCE_LABEL: Record<string, string> = {
  voice: '🎙️ Voice',
  scan: '📷 Scanned',
  sms: '💬 SMS',
  split: '👥 Split',
  manual: '',
};

export const ExpenseTracker: React.FC = () => {
  const { expenses, logExpense, deleteExpense, awardXP } = useApp();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [categoryLocked, setCategoryLocked] = useState(false);
  const [range, setRange] = useState<Range>('today');
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const visible = useMemo(
    () => (range === 'today' ? expensesOn(expenses, getTodayDate()) : expensesThisWeek(expenses)),
    [expenses, range]
  );

  const total = useMemo(() => sum(visible), [visible]);
  const slices = useMemo(
    () => byCategory(visible).map((c) => ({ label: c.category, value: c.total, color: c.color })),
    [visible]
  );

  // Typing "swiggy" should pick Food without the user touching the dropdown.
  const onDescriptionChange = (value: string) => {
    setDescription(value);
    if (!categoryLocked && value.length > 2) {
      const detected = detectCategory(value);
      if (detected !== 'Other') setCategory(detected);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;

    logExpense({
      amount: value,
      description: description.trim() || category,
      category,
      date: getTodayDate(),
      source: 'manual',
    });
    awardXP(10, 'Expense logged', { silent: true });

    setAmount('');
    setDescription('');
    setCategoryLocked(false);
  };

  const quickAdd = (
    result: { amount: number; description: string; category: string },
    source: 'voice' | 'scan'
  ) => {
    logExpense({
      amount: result.amount,
      description: result.description,
      category: result.category,
      date: getTodayDate(),
      source,
    });
    awardXP(source === 'scan' ? 30 : 20, source === 'scan' ? 'Receipt scanned' : 'Voice logged');
  };

  const hovered = hoveredSlice ? slices.find((s) => s.label === hoveredSlice) : null;

  return (
    <>
      <Panel>
        <PanelHeader
          title="Expenses"
          subtitle={range === 'today' ? "Today's spending" : 'This week'}
          icon={<Wallet className="h-3.5 w-3.5" />}
          action={
            <Segmented
              options={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Week' },
              ]}
              value={range}
              onChange={setRange}
            />
          }
        />

        <PanelBody className="space-y-4">
          {/* Quick capture */}
          <form onSubmit={submit} className="space-y-2.5">
            <div className="flex gap-2">
              <MoneyInput
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-28 shrink-0 font-semibold"
                aria-label="Amount"
              />
              <div className="relative min-w-0 flex-1">
                <Input
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="What was it for?"
                  className="pr-9"
                  aria-label="Description"
                />
                {description.length > 1 && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base">
                    {detectEmoji(description, category)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setCategoryLocked(true);
                }}
                className="min-w-0 flex-1"
                aria-label="Category"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.emoji} {c.key}
                  </option>
                ))}
              </Select>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setVoiceOpen(true)}
                icon={<Mic className="h-3.5 w-3.5" />}
                className="shrink-0"
                title="Log by voice"
              >
                <span className="hidden sm:inline">Voice</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setScanOpen(true)}
                icon={<Camera className="h-3.5 w-3.5" />}
                className="shrink-0"
                title="Scan a receipt"
              >
                <span className="hidden sm:inline">Scan</span>
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Plus className="h-3.5 w-3.5" />}
                disabled={!Number(amount)}
                className="shrink-0"
              >
                Add
              </Button>
            </div>
          </form>

          {/* Donut + totals */}
          {visible.length > 0 && (
            <div className="flex items-center gap-5 border-t border-line pt-4">
              <Donut data={slices} size={116} thickness={13} onHover={(s) => setHoveredSlice(s?.label ?? null)}>
                {hovered ? (
                  <>
                    <p className="text-2xs text-faint">{hovered.label}</p>
                    <p className="text-sm font-semibold tabnum text-ink">
                      {formatCurrency(hovered.value)}
                    </p>
                    <p className="text-2xs tabnum text-faint">
                      {Math.round((hovered.value / total) * 100)}%
                    </p>
                  </>
                ) : (
                  <>
                    <p className="eyebrow">Total</p>
                    <AnimatedNumber
                      value={total}
                      format={(n) => formatCurrency(n)}
                      className="text-base font-semibold text-ink"
                    />
                    <p className="text-2xs text-faint">
                      {visible.length} {visible.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </>
                )}
              </Donut>

              <div className="min-w-0 flex-1 space-y-1.5">
                {slices.slice(0, 5).map((slice) => (
                  <div
                    key={slice.label}
                    onMouseEnter={() => setHoveredSlice(slice.label)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={cn(
                      'flex items-center gap-2 rounded px-1 py-0.5 transition-colors',
                      hoveredSlice === slice.label && 'bg-surface'
                    )}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs text-muted">
                      {slice.label}
                    </span>
                    <span className="shrink-0 text-xs font-medium tabnum text-ink">
                      {formatCurrency(slice.value)}
                    </span>
                    <span className="w-8 shrink-0 text-right text-2xs tabnum text-faint">
                      {Math.round((slice.value / total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PanelBody>

        {/* Ledger */}
        {visible.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={range === 'today' ? 'Nothing logged today' : 'Nothing logged this week'}
            description="Type it, say it, or scan the receipt. Three ways in, no excuses."
          />
        ) : (
          <div className="max-h-72 divide-y divide-line overflow-y-auto border-t border-line scrollbar-slim">
            {visible.map((expense) => (
              <div
                key={expense.id}
                className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-sm">
                  {detectEmoji(expense.description, expense.category)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {expense.description || expense.category}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-2xs text-faint">
                    <span>{expense.category}</span>
                    <span>·</span>
                    <span className="tabnum">
                      {new Date(expense.timestamp).toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    {expense.source && expense.source !== 'manual' && (
                      <>
                        <span>·</span>
                        <span>{SOURCE_LABEL[expense.source]}</span>
                      </>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabnum text-ink">
                  {formatCurrency(expense.amount)}
                </span>
                <IconButton
                  label="Delete expense"
                  onClick={() => deleteExpense(expense.id)}
                  className="shrink-0 opacity-0 transition-opacity hover:text-negative focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <VoiceExpenseCapture
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onConfirm={(result) => quickAdd(result, 'voice')}
      />
      <BillScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onConfirm={(result) => quickAdd(result, 'scan')}
      />
    </>
  );
};
