'use client';

import React, { useMemo, useState } from 'react';
import { CalendarClock, Check, Plus, Target, Trash2, TrendingUp, X } from 'lucide-react';
import { Panel, PanelBody, PanelHeader, EmptyState } from '@/components/ui/Panel';
import { Button, IconButton } from '@/components/ui/Button';
import { FieldShell, Input, MoneyInput, Slider } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { milestoneConfetti } from '@/lib/celebrate';
import type { SavingsGoal } from '@/types';
import { cn, formatCurrency, formatDuration, getTodayDate, uid } from '@/lib/utils';

const ICONS = ['🎯', '💻', '📱', '🎧', '✈️', '🏍️', '📷', '🎸', '👟', '🎓', '🛡️', '🏠'];

/** Milestones worth celebrating rather than confetti on every rupee. */
const MILESTONES = [0.25, 0.5, 0.75, 1];

const crossedMilestone = (before: number, after: number): number | null => {
  const hit = MILESTONES.find((m) => before < m && after >= m);
  return hit ?? null;
};

const GoalCard: React.FC<{
  goal: SavingsGoal;
  monthlyPace: number;
  onAdd: (amount: number) => void;
  onSetContribution: (amount: number) => void;
  onDelete: () => void;
}> = ({ goal, monthlyPace, onAdd, onSetContribution, onDelete }) => {
  const [depositOpen, setDepositOpen] = useState(false);
  const [deposit, setDeposit] = useState('');

  const ratio = goal.targetAmount > 0 ? goal.savedAmount / goal.targetAmount : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const complete = remaining === 0;

  // The slider lets the user see how speeding up changes the finish date.
  const contribution = goal.monthlyContribution ?? Math.max(100, Math.round(monthlyPace) || 500);
  const months = contribution > 0 ? remaining / contribution : Infinity;
  const naturalMonths = monthlyPace > 0 ? remaining / monthlyPace : Infinity;

  const finishDate = useMemo(() => {
    if (!Number.isFinite(months) || months <= 0) return null;
    const date = new Date();
    date.setMonth(date.getMonth() + Math.ceil(months));
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }, [months]);

  const maxSlider = Math.max(2000, Math.ceil(remaining / 3 / 100) * 100 || 2000);

  return (
    <div className="space-y-2.5 px-4 py-3.5 transition-colors hover:bg-surface">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-base">
          {goal.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium text-ink">{goal.name}</p>
            <span className="shrink-0 text-2xs font-semibold tabnum text-muted">
              {Math.round(ratio * 100)}%
            </span>
          </div>
          <p className="text-2xs tabnum text-faint">
            {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
          </p>
        </div>
        <IconButton
          label="Delete goal"
          onClick={onDelete}
          className="shrink-0 hover:text-negative"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      <ProgressBar
        value={ratio * 100}
        height={5}
        barClassName={complete ? 'bg-positive' : 'bg-accent'}
      />

      {complete ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-positive">
          <Check className="h-3.5 w-3.5" />
          Goal complete — {formatCurrency(goal.targetAmount)} saved
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2 text-2xs text-muted">
            <CalendarClock className="h-3 w-3 shrink-0" />
            <span>
              {Number.isFinite(months) ? (
                <>
                  Done in{' '}
                  <span className="font-semibold text-ink">{formatDuration(months)}</span>
                  {finishDate && <span className="text-faint"> · {finishDate}</span>}
                </>
              ) : (
                'Set a monthly amount to see an ETA'
              )}
            </span>
          </div>

          {/* Speed-up slider */}
          <div className="space-y-1.5 rounded-lg border border-line bg-elevated p-2.5">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Monthly contribution</span>
              <span className="text-xs font-semibold tabnum text-accent">
                {formatCurrency(contribution)}
              </span>
            </div>
            <Slider
              min={100}
              max={maxSlider}
              step={100}
              value={Math.min(contribution, maxSlider)}
              onChange={(e) => onSetContribution(Number(e.target.value))}
            />
            {Number.isFinite(naturalMonths) && contribution > monthlyPace && monthlyPace > 0 && (
              <p className="flex items-center gap-1 text-2xs text-positive">
                <TrendingUp className="h-2.5 w-2.5" />
                {formatDuration(naturalMonths - months)} faster than your current pace
              </p>
            )}
          </div>

          {depositOpen ? (
            <div className="flex gap-1.5">
              <MoneyInput
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="Amount"
                className="h-8 flex-1"
                autoFocus
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const value = Number(deposit);
                  if (value > 0) onAdd(value);
                  setDeposit('');
                  setDepositOpen(false);
                }}
                disabled={!Number(deposit)}
              >
                Add
              </Button>
              <IconButton label="Cancel" onClick={() => setDepositOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          ) : (
            <div className="flex gap-1.5">
              {[100, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => onAdd(amount)}
                  className="chip flex-1 justify-center transition-colors hover:border-accent/40 hover:text-accent"
                >
                  +{formatCurrency(amount)}
                </button>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setDepositOpen(true)}>
                Custom
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const SavingsGoals: React.FC = () => {
  const { goals, saveGoals, budget, awardXP, pushToast } = useApp();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState('🎯');

  // Observed pace: what the user is actually managing to not spend each month.
  const monthlyPace = Math.max(0, budget.monthlyAllowance - budget.projectedMonthEnd);

  const create = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(target);
    if (!name.trim() || !Number.isFinite(amount) || amount <= 0) return;

    const goal: SavingsGoal = {
      id: uid('goal'),
      name: name.trim(),
      targetAmount: amount,
      savedAmount: 0,
      category: 'General',
      icon,
      createdAt: getTodayDate(),
      monthlyContribution: Math.max(100, Math.round(monthlyPace) || 500),
      contributions: [],
    };

    saveGoals([...goals, goal]);
    awardXP(50, `Goal created: ${goal.name}`);
    setName('');
    setTarget('');
    setIcon('🎯');
    setAdding(false);
  };

  const addMoney = (goalId: string, amount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const before = goal.savedAmount / goal.targetAmount;
    const nextSaved = Math.min(goal.targetAmount, goal.savedAmount + amount);
    const after = nextSaved / goal.targetAmount;

    saveGoals(
      goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              savedAmount: nextSaved,
              contributions: [...(g.contributions ?? []), { date: getTodayDate(), amount }],
            }
          : g
      )
    );

    const milestone = crossedMilestone(before, after);
    if (milestone) {
      void milestoneConfetti();
      pushToast({
        variant: 'success',
        icon: milestone === 1 ? '🏆' : '🎉',
        title:
          milestone === 1
            ? `${goal.name} complete`
            : `${Math.round(milestone * 100)}% of ${goal.name}`,
        description:
          milestone === 1
            ? `You saved the full ${formatCurrency(goal.targetAmount)}.`
            : `${formatCurrency(goal.targetAmount - nextSaved)} to go.`,
      });
      awardXP(milestone === 1 ? 300 : 100, `${goal.name} milestone`, { silent: true });
    } else {
      awardXP(15, 'Added to savings', { silent: true });
    }
  };

  const totalSaved = goals.reduce((acc, g) => acc + g.savedAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);

  return (
    <Panel>
      <PanelHeader
        title="Savings goals"
        subtitle={
          goals.length > 0
            ? `${formatCurrency(totalSaved)} of ${formatCurrency(totalTarget)} saved`
            : 'Give your money a destination'
        }
        icon={<Target className="h-3.5 w-3.5" />}
        action={
          <Button
            variant={adding ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() => setAdding(!adding)}
            icon={adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          >
            {adding ? 'Cancel' : 'New goal'}
          </Button>
        }
      />

      {adding && (
        <form
          onSubmit={create}
          className="animate-fade-up space-y-3 border-b border-line bg-surface p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldShell label="What are you saving for?">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="AirPods Pro"
                autoFocus
              />
            </FieldShell>
            <FieldShell label="Target amount">
              <MoneyInput
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="12000"
              />
            </FieldShell>
          </div>

          <FieldShell label="Icon">
            <div className="flex flex-wrap gap-1">
              {ICONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setIcon(option)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md border text-base transition-all',
                    icon === option
                      ? 'border-accent bg-accent/10'
                      : 'border-line bg-elevated hover:border-line-strong'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </FieldShell>

          {Number(target) > 0 && monthlyPace > 0 && (
            <p className="rounded-md border border-line bg-elevated px-3 py-2 text-2xs text-muted">
              At your current pace of {formatCurrency(monthlyPace)} a month, this takes{' '}
              <span className="font-semibold text-ink">
                {formatDuration(Number(target) / monthlyPace)}
              </span>
              .
            </p>
          )}

          <Button type="submit" variant="primary" disabled={!name.trim() || !Number(target)}>
            Create goal
          </Button>
        </form>
      )}

      {goals.length === 0 && !adding ? (
        <EmptyState
          icon="🎯"
          title="No goals yet"
          description="Goals are worth 15 points of your Smartwise Score, and they make saving feel like progress instead of restraint."
          action={
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              Create your first goal
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-line">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              monthlyPace={monthlyPace}
              onAdd={(amount) => addMoney(goal.id, amount)}
              onSetContribution={(amount) =>
                saveGoals(
                  goals.map((g) =>
                    g.id === goal.id ? { ...g, monthlyContribution: amount } : g
                  )
                )
              }
              onDelete={() => saveGoals(goals.filter((g) => g.id !== goal.id))}
            />
          ))}
        </div>
      )}
    </Panel>
  );
};
