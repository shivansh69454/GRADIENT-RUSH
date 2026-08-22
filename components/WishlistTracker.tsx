'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, Heart, Plus, Target, Trash2, X } from 'lucide-react';
import { Panel, PanelBody, PanelHeader, EmptyState } from '@/components/ui/Panel';
import { Button, IconButton } from '@/components/ui/Button';
import { FieldShell, Input, MoneyInput, Select } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { getWishlist, setWishlist } from '@/lib/storage';
import type { SavingsGoal, WishlistItem } from '@/types';
import { cn, formatCurrency, formatDuration, getTodayDate, uid } from '@/lib/utils';

const PLATFORMS = ['Amazon', 'Flipkart', 'Myntra', 'Croma', 'Apple', 'Local store', 'Other'];

/**
 * Wishlist that plugs into savings rather than sitting on its own.
 *
 * The old version simulated price drops. This one is honest: you record what a
 * thing costs and what you are willing to pay, and Smartwise tells you how long
 * saving for it actually takes — then converts it into a real goal.
 */
export const WishlistTracker: React.FC = () => {
  const { goals, saveGoals, budget, player, awardXP, pushToast } = useApp();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [adding, setAdding] = useState(false);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [target, setTarget] = useState('');
  const [platform, setPlatform] = useState('Amazon');

  useEffect(() => setItems(getWishlist()), []);

  const persist = (next: WishlistItem[]) => {
    setItems(next);
    setWishlist(next);
  };

  const monthlyPace = Math.max(0, player.monthly_allowance - budget.projectedMonthEnd);

  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const current = Number(price);
    if (!name.trim() || !Number.isFinite(current) || current <= 0) return;

    const item: WishlistItem = {
      id: uid('wish'),
      name: name.trim(),
      category: 'Shopping',
      currentPrice: current,
      targetPrice: Number(target) > 0 ? Number(target) : Math.round(current * 0.85),
      platform,
      isPurchased: false,
      addedAt: getTodayDate(),
    };
    persist([item, ...items]);
    awardXP(15, 'Added to wishlist', { silent: true });

    setName('');
    setPrice('');
    setTarget('');
    setAdding(false);
  };

  const convertToGoal = (item: WishlistItem) => {
    if (goals.some((g) => g.name === item.name)) {
      pushToast({ variant: 'info', title: 'Already a goal', description: `${item.name} is in your goals.` });
      return;
    }
    const goal: SavingsGoal = {
      id: uid('goal'),
      name: item.name,
      targetAmount: item.targetPrice,
      savedAmount: 0,
      category: 'Wishlist',
      icon: '🛍️',
      createdAt: getTodayDate(),
      monthlyContribution: Math.max(100, Math.round(monthlyPace) || 500),
      contributions: [],
    };
    saveGoals([...goals, goal]);
    awardXP(40, `Turned ${item.name} into a goal`);
    pushToast({
      variant: 'success',
      icon: '🎯',
      title: `${item.name} is now a goal`,
      description: `Target ${formatCurrency(item.targetPrice)}.`,
    });
  };

  const markBought = (item: WishlistItem) => {
    persist(items.map((i) => (i.id === item.id ? { ...i, isPurchased: !i.isPurchased } : i)));
  };

  return (
    <Panel>
      <PanelHeader
        title="Wishlist"
        subtitle={
          items.length > 0
            ? `${items.filter((i) => !i.isPurchased).length} things you want`
            : 'Wants, priced honestly'
        }
        icon={<Heart className="h-3.5 w-3.5" />}
        action={
          <Button
            variant={adding ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() => setAdding(!adding)}
            icon={adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          >
            {adding ? 'Cancel' : 'Add'}
          </Button>
        }
      />

      {adding && (
        <form onSubmit={add} className="animate-fade-up space-y-3 border-b border-line bg-surface p-4">
          <FieldShell label="What do you want?">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sony WH-1000XM5"
              autoFocus
            />
          </FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell label="Current price">
              <MoneyInput
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29990"
              />
            </FieldShell>
            <FieldShell label="Buy at" hint="Defaults to 15% off">
              <MoneyInput
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={price ? String(Math.round(Number(price) * 0.85)) : '24990'}
              />
            </FieldShell>
          </div>
          <FieldShell label="Where">
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </FieldShell>

          {Number(price) > 0 && monthlyPace > 0 && (
            <p className="rounded-md border border-line bg-elevated px-3 py-2 text-2xs text-muted">
              At your pace of {formatCurrency(monthlyPace)} a month, this takes{' '}
              <span className="font-semibold text-ink">
                {formatDuration(Number(price) / monthlyPace)}
              </span>{' '}
              to save for.
            </p>
          )}

          <Button type="submit" variant="primary" disabled={!name.trim() || !Number(price)}>
            Add to wishlist
          </Button>
        </form>
      )}

      {items.length === 0 && !adding ? (
        <EmptyState
          icon="🛍️"
          title="Nothing on the list"
          description="Write down what you want and what you will pay for it. Naming the price is what turns an impulse into a plan."
        />
      ) : (
        <div className="divide-y divide-line">
          {items.map((item) => {
            const goal = goals.find((g) => g.name === item.name);
            const savedRatio = goal
              ? Math.min(1, goal.savedAmount / Math.max(1, goal.targetAmount))
              : 0;
            const months = monthlyPace > 0 ? item.targetPrice / monthlyPace : Infinity;
            const discount =
              item.currentPrice > 0
                ? (item.currentPrice - item.targetPrice) / item.currentPrice
                : 0;

            return (
              <div
                key={item.id}
                className={cn(
                  'space-y-2 px-4 py-3 transition-colors hover:bg-surface',
                  item.isPurchased && 'opacity-55'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-sm font-medium text-ink',
                        item.isPurchased && 'line-through decoration-faint'
                      )}
                    >
                      {item.name}
                    </p>
                    <p className="text-2xs text-faint">
                      {item.platform} · listed {formatCurrency(item.currentPrice)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabnum text-ink">
                      {formatCurrency(item.targetPrice)}
                    </p>
                    {discount > 0.01 && (
                      <p className="text-2xs tabnum text-positive">
                        {Math.round(discount * 100)}% below list
                      </p>
                    )}
                  </div>
                  <IconButton
                    label="Remove"
                    onClick={() => persist(items.filter((i) => i.id !== item.id))}
                    className="shrink-0 hover:text-negative"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>

                {goal ? (
                  <div className="space-y-1">
                    <ProgressBar
                      value={savedRatio * 100}
                      height={4}
                      barClassName={savedRatio >= 1 ? 'bg-positive' : 'bg-accent'}
                    />
                    <p className="text-2xs tabnum text-muted">
                      {formatCurrency(goal.savedAmount)} saved of{' '}
                      {formatCurrency(goal.targetAmount)}
                      {savedRatio >= 1 && (
                        <span className="ml-1 font-medium text-positive">— you can buy it</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Number.isFinite(months) && (
                      <span className="chip">
                        <Bell className="h-2.5 w-2.5" />
                        {formatDuration(months)} of saving
                      </span>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => convertToGoal(item)}
                      icon={<Target className="h-3 w-3" />}
                    >
                      Make it a goal
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markBought(item)}
                      icon={<Check className="h-3 w-3" />}
                    >
                      {item.isPurchased ? 'Undo' : 'Bought it'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
};

export default WishlistTracker;
