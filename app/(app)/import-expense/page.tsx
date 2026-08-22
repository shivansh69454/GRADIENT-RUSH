'use client';

import React, { useMemo, useState } from 'react';
import { Check, Download, Eraser, MessageSquareText, Sparkles, Wand2 } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/AppShell';
import { Panel, PanelBody, PanelHeader, EmptyState } from '@/components/ui/Panel';
import { Button, IconButton } from '@/components/ui/Button';
import { Segmented, Select, Textarea } from '@/components/ui/Field';
import { StatementImport } from '@/components/StatementImport';
import { useApp } from '@/contexts/AppContext';
import { SAMPLE_MESSAGES, TOKEN_STYLES, parseBatch } from '@/lib/smsParser';
import { CATEGORIES, detectEmoji } from '@/lib/categories';
import type { ParsedTransaction, TokenKind } from '@/types';
import { cn, formatCurrency, formatShortDate } from '@/lib/utils';

const LEGEND: TokenKind[] = ['amount', 'merchant', 'account', 'date', 'ref'];

type Mode = 'sms' | 'screenshot';

const MODES: { value: Mode; label: string }[] = [
  { value: 'sms', label: 'Bank SMS' },
  { value: 'screenshot', label: 'Screenshot' },
];

/** Renders the raw SMS with each recognised token tinted by what it is. */
const HighlightedMessage: React.FC<{ transaction: ParsedTransaction }> = ({ transaction }) => (
  <p className="text-xs leading-relaxed text-muted">
    {transaction.tokens.map((token, index) =>
      token.kind === 'plain' ? (
        <React.Fragment key={index}>{token.text}</React.Fragment>
      ) : (
        <span
          key={index}
          title={TOKEN_STYLES[token.kind].label}
          className={cn('rounded px-1 py-0.5', TOKEN_STYLES[token.kind].className)}
        >
          {token.text}
        </span>
      )
    )}
  </p>
);

const SmsImporter: React.FC<{ onImported: (count: number) => void }> = ({ onImported }) => {
  const { logExpenses, awardXP, pushToast } = useApp();
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  // Parsing is pure and cheap, so it runs on every keystroke — that live
  // highlight-as-you-type behaviour is the whole point of this screen.
  const transactions = useMemo(() => parseBatch(input), [input]);

  const debits = useMemo(() => transactions.filter((t) => t.direction === 'debit'), [transactions]);
  const credits = useMemo(
    () => transactions.filter((t) => t.direction === 'credit'),
    [transactions]
  );

  const effectiveSelection = useMemo(() => {
    // Default to every confident debit being selected.
    if (selected.size > 0) return selected;
    return new Set(debits.filter((t) => t.confidence >= 0.6).map((t) => t.id));
  }, [selected, debits]);

  const toggle = (id: string) => {
    const next = new Set(effectiveSelection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const chosen = debits.filter((t) => effectiveSelection.has(t.id));
  const chosenTotal = chosen.reduce((acc, t) => acc + (t.amount ?? 0), 0);

  const runImport = () => {
    if (chosen.length === 0) return;

    logExpenses(
      chosen.map((transaction) => ({
        amount: transaction.amount ?? 0,
        description: transaction.merchant || 'Imported transaction',
        category: overrides[transaction.id] ?? transaction.category,
        date: transaction.date,
        source: 'sms' as const,
      }))
    );

    const xp = chosen.length * 50;
    awardXP(xp, `Imported ${chosen.length} transactions`);
    pushToast({
      variant: 'success',
      icon: '📥',
      title: `Imported ${chosen.length} ${chosen.length === 1 ? 'transaction' : 'transactions'}`,
      description: `${formatCurrency(chosenTotal)} added to your ledger.`,
    });

    onImported(chosen.length);
    setInput('');
    setSelected(new Set([]));
    setOverrides({});
  };

  const loadSamples = () => {
    setInput(SAMPLE_MESSAGES.map((m) => m.text).join('\n\n'));
    setSelected(new Set([]));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Input */}
      <Panel>
        <PanelHeader
          title="Paste your alerts"
          subtitle="One or many — blank lines separate them"
          icon={<MessageSquareText className="h-3.5 w-3.5" />}
          action={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={loadSamples}
                icon={<Wand2 className="h-3.5 w-3.5" />}
              >
                Load samples
              </Button>
              {input && (
                <IconButton label="Clear" onClick={() => setInput('')}>
                  <Eraser className="h-3.5 w-3.5" />
                </IconButton>
              )}
            </>
          }
        />
        <PanelBody className="space-y-3">
          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSelected(new Set([]));
            }}
            rows={14}
            spellCheck={false}
            placeholder={`Rs.249.00 debited from a/c XX4471 on 12-08-25 to SWIGGY via UPI Ref 452817...

Paste as many as you like, separated by a blank line.`}
            className="resize-none font-mono text-xs leading-relaxed"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="eyebrow mr-1">Detects</span>
            {LEGEND.map((kind) => (
              <span
                key={kind}
                className={cn('rounded px-1.5 py-0.5 text-2xs', TOKEN_STYLES[kind].className)}
              >
                {TOKEN_STYLES[kind].label}
              </span>
            ))}
          </div>

          <p className="text-2xs leading-relaxed text-faint">
            Nothing is uploaded. Parsing happens entirely in this tab with regular expressions — no
            bank connection, no permissions, no server.
          </p>
        </PanelBody>
      </Panel>

      {/* Output */}
      <Panel>
        <PanelHeader
          title="Detected transactions"
          subtitle={
            transactions.length > 0
              ? `${debits.length} debits · ${credits.length} credits`
              : 'Live as you type'
          }
          icon={<Sparkles className="h-3.5 w-3.5" />}
          action={
            debits.length > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(new Set(debits.map((t) => t.id)))}
                >
                  All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set([]))}>
                  None
                </Button>
              </>
            ) : undefined
          }
        />

        {transactions.length === 0 ? (
          <EmptyState
            icon="💬"
            title={input.trim() ? 'Nothing recognised yet' : 'Waiting for a message'}
            description={
              input.trim()
                ? 'Smartwise needs an amount to work with. Make sure the message includes Rs, INR, or ₹ followed by a number.'
                : 'Paste a bank SMS or UPI notification. Amounts, merchants, accounts and dates get highlighted the moment they are recognised.'
            }
            action={
              !input.trim() ? (
                <Button variant="secondary" size="sm" onClick={loadSamples}>
                  Load sample messages
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="max-h-[560px] divide-y divide-line overflow-y-auto scrollbar-slim">
            {transactions.map((transaction) => {
              const isCredit = transaction.direction === 'credit';
              const isSelected = effectiveSelection.has(transaction.id);
              const category = overrides[transaction.id] ?? transaction.category;

              return (
                <div
                  key={transaction.id}
                  className={cn(
                    'space-y-2.5 px-4 py-3 transition-colors',
                    isSelected && !isCredit && 'bg-accent/4'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {!isCredit && (
                      <button
                        onClick={() => toggle(transaction.id)}
                        aria-label={isSelected ? 'Deselect' : 'Select'}
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
                        <p className="min-w-0 truncate text-sm font-medium text-ink">
                          {detectEmoji(transaction.merchant ?? '', category)}{' '}
                          {transaction.merchant ?? 'Unknown merchant'}
                        </p>
                        <p
                          className={cn(
                            'shrink-0 text-sm font-semibold tabnum',
                            isCredit ? 'text-positive' : 'text-ink'
                          )}
                        >
                          {isCredit ? '+' : '−'}
                          {formatCurrency(transaction.amount ?? 0)}
                        </p>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={
                            transaction.confidence >= 0.75
                              ? 'chip chip-positive'
                              : transaction.confidence >= 0.5
                                ? 'chip chip-warning'
                                : 'chip chip-negative'
                          }
                        >
                          {Math.round(transaction.confidence * 100)}%
                        </span>
                        {isCredit && <span className="chip chip-positive">Money in</span>}
                        <span className="chip">{formatShortDate(transaction.date)}</span>
                        {transaction.accountHint && (
                          <span className="chip">{transaction.accountHint}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-line bg-surface p-2.5">
                    <HighlightedMessage transaction={transaction} />
                  </div>

                  {!isCredit && (
                    <div className="flex items-center gap-2">
                      <span className="eyebrow shrink-0">Category</span>
                      <Select
                        value={category}
                        onChange={(e) =>
                          setOverrides({ ...overrides, [transaction.id]: e.target.value })
                        }
                        className="h-7 flex-1 text-xs"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.emoji} {c.key}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {isCredit && (
                    <p className="text-2xs text-faint">
                      Credits are shown for context but not imported — Smartwise tracks spending, not
                      income.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {chosen.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3">
            <div>
              <p className="text-xs font-medium text-ink">
                {chosen.length} selected · {formatCurrency(chosenTotal)}
              </p>
              <p className="text-2xs text-faint">Worth {chosen.length * 50} XP on import</p>
            </div>
            <Button
              variant="primary"
              onClick={runImport}
              icon={<Download className="h-3.5 w-3.5" />}
            >
              Import selected
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default function ImportExpensePage() {
  const [mode, setMode] = useState<Mode>('sms');
  const [imported, setImported] = useState(0);

  return (
    <>
      <PageHeader
        title="Import expenses"
        description="Paste a bank alert or a whole payment screenshot"
        eyebrow="Workspace"
        action={<Segmented options={MODES} value={mode} onChange={setMode} />}
      />

      <PageBody className="space-y-4">
        {mode === 'sms' ? (
          <SmsImporter onImported={(count) => setImported((n) => n + count)} />
        ) : (
          <StatementImport />
        )}

        {imported > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-positive/25 bg-positive/5 px-3.5 py-2.5">
            <Check className="h-4 w-4 shrink-0 text-positive" />
            <p className="text-xs text-muted">
              <span className="font-medium text-ink">{imported}</span>{' '}
              {imported === 1 ? 'transaction' : 'transactions'} imported this session. They are in
              your ledger, budget, Smartwise Score, and heatmap already.
            </p>
          </div>
        )}
      </PageBody>
    </>
  );
}
