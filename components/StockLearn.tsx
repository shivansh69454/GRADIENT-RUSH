'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, GraduationCap, Info, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { MoneyInput } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/Charts';
import { useApp } from '@/contexts/AppContext';
import { REFERENCE_DATE, STOCKS, opportunityCost } from '@/lib/stocks';
import { byCategory, expensesLastNDays } from '@/lib/analytics';
import { getPortfolio, setPortfolio } from '@/lib/storage';
import type { Stock, VirtualPortfolio } from '@/types';
import { cn, formatCurrency, getTodayDate } from '@/lib/utils';

/**
 * Learn mode replaces the old fake ticker.
 *
 * Prices are dated reference points, clearly labelled, and every card teaches a
 * concept. The virtual ₹10,000 portfolio lets students practise allocation
 * without ever implying they are watching a live market.
 */
export const StockLearn: React.FC = () => {
  const { expenses, awardXP, completeTaskByKey, pushToast } = useApp();
  const [portfolio, setPortfolioState] = useState<VirtualPortfolio>({
    cash: 10000,
    holdings: [],
    studied: [],
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState('');

  useEffect(() => setPortfolioState(getPortfolio()), []);

  const persist = (next: VirtualPortfolio) => {
    setPortfolioState(next);
    setPortfolio(next);
  };

  const holdingsValue = useMemo(
    () =>
      portfolio.holdings.reduce((acc, holding) => {
        const stock = STOCKS.find((s) => s.symbol === holding.symbol);
        if (!stock) return acc;
        // Value the holding using the reference return, not a random walk.
        return acc + holding.units * stock.referencePrice * (1 + stock.yearReturnPct / 100);
      }, 0),
    [portfolio.holdings]
  );

  const investedValue = portfolio.holdings.reduce((acc, h) => acc + h.units * h.avgPrice, 0);
  const totalValue = portfolio.cash + holdingsValue;
  const pnl = holdingsValue - investedValue;

  const study = (stock: Stock) => {
    setExpanded(expanded === stock.id ? null : stock.id);
    if (portfolio.studied.includes(stock.symbol) || expanded === stock.id) return;

    persist({ ...portfolio, studied: [...portfolio.studied, stock.symbol] });
    awardXP(25, `Studied ${stock.symbol}`);
    completeTaskByKey('study-stock');
  };

  const buy = (stock: Stock) => {
    const amount = Number(buyAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (amount > portfolio.cash) {
      pushToast({
        variant: 'warning',
        title: 'Not enough virtual cash',
        description: `You have ${formatCurrency(portfolio.cash)} left of your ₹10,000.`,
      });
      return;
    }

    const units = amount / stock.referencePrice;
    const existing = portfolio.holdings.find((h) => h.symbol === stock.symbol);
    const holdings = existing
      ? portfolio.holdings.map((h) =>
          h.symbol === stock.symbol
            ? {
                ...h,
                units: h.units + units,
                avgPrice:
                  (h.units * h.avgPrice + units * stock.referencePrice) / (h.units + units),
              }
            : h
        )
      : [
          ...portfolio.holdings,
          {
            symbol: stock.symbol,
            units,
            avgPrice: stock.referencePrice,
            investedAt: getTodayDate(),
          },
        ];

    persist({ ...portfolio, cash: portfolio.cash - amount, holdings });
    setBuyAmount('');
    awardXP(20, `Allocated to ${stock.symbol}`, { silent: true });
    pushToast({
      variant: 'success',
      icon: '📈',
      title: `${formatCurrency(amount)} into ${stock.symbol}`,
      description: `${units.toFixed(3)} units at ${formatCurrency(stock.referencePrice)}`,
    });
  };

  // The opportunity-cost hook: reframe a real spending category as an investment.
  const topCategory = useMemo(() => byCategory(expensesLastNDays(expenses, 30))[0], [expenses]);
  const reframeStock = STOCKS.find((s) => s.symbol === 'NIFTYBEES') ?? STOCKS[0];
  const reframe = topCategory
    ? opportunityCost(topCategory.total, reframeStock)
    : null;

  return (
    <div className="space-y-4">
      {/* Portfolio */}
      <Panel>
        <PanelHeader
          title="Virtual portfolio"
          subtitle="Practise with ₹10,000 of nobody's money"
          icon={<Wallet className="h-3.5 w-3.5" />}
          action={
            <span className={pnl >= 0 ? 'chip chip-positive' : 'chip chip-negative'}>
              {pnl >= 0 ? '+' : ''}
              {formatCurrency(pnl)}
            </span>
          }
        />
        <PanelBody className="space-y-3.5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="eyebrow">Total value</p>
              <p className="text-lg font-semibold tabnum text-ink">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div>
              <p className="eyebrow">Cash left</p>
              <p className="text-lg font-semibold tabnum text-ink">
                {formatCurrency(portfolio.cash)}
              </p>
            </div>
            <div>
              <p className="eyebrow">Studied</p>
              <p className="text-lg font-semibold tabnum text-ink">
                {portfolio.studied.length}
                <span className="text-faint">/{STOCKS.length}</span>
              </p>
            </div>
          </div>

          <ProgressBar
            value={portfolio.studied.length}
            max={STOCKS.length}
            height={4}
            barClassName="bg-positive"
          />

          {portfolio.holdings.length > 0 && (
            <div className="space-y-1.5 border-t border-line pt-3">
              {portfolio.holdings.map((holding) => {
                const stock = STOCKS.find((s) => s.symbol === holding.symbol);
                if (!stock) return null;
                const current =
                  holding.units * stock.referencePrice * (1 + stock.yearReturnPct / 100);
                const cost = holding.units * holding.avgPrice;
                const change = current - cost;
                return (
                  <div key={holding.symbol} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 truncate text-xs font-medium text-ink">
                      {stock.symbol}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-2xs text-faint tabnum">
                      {holding.units.toFixed(2)} units
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabnum text-ink">
                      {formatCurrency(current)}
                    </span>
                    <span
                      className={cn(
                        'w-16 shrink-0 text-right text-2xs font-medium tabnum',
                        change >= 0 ? 'text-positive' : 'text-negative'
                      )}
                    >
                      {change >= 0 ? '+' : ''}
                      {formatCurrency(change)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {reframe && topCategory && (
            <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface p-3">
              <span className="mt-0.5 text-base">{topCategory.emoji}</span>
              <p className="text-xs leading-relaxed text-muted">
                Your{' '}
                <span className="font-semibold text-ink">
                  {formatCurrency(topCategory.total)}
                </span>{' '}
                of {topCategory.category} spending over the last 30 days, put into a Nifty 50 index
                fund a year ago, would be worth{' '}
                <span
                  className={cn(
                    'font-semibold tabnum',
                    reframe.isGain ? 'text-positive' : 'text-negative'
                  )}
                >
                  {formatCurrency(reframe.value)}
                </span>{' '}
                today. That is {reframe.isGain ? 'a gain of' : 'a loss of'}{' '}
                {formatCurrency(Math.abs(reframe.gain))}.
              </p>
            </div>
          )}
        </PanelBody>
      </Panel>

      {/* Watchlist */}
      <Panel>
        <PanelHeader
          title="Learn mode"
          subtitle={`Reference prices from ${REFERENCE_DATE} · not live`}
          icon={<GraduationCap className="h-3.5 w-3.5" />}
        />

        <div className="flex items-start gap-2 border-b border-line bg-warning/[0.05] px-4 py-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <p className="text-2xs leading-relaxed text-muted">
            These are fixed reference prices with a stated date, not a live feed. Smartwise will never
            show you a simulated ticker — you would learn the wrong lesson from fake movement.
          </p>
        </div>

        <div className="divide-y divide-line">
          {STOCKS.map((stock) => {
            const isOpen = expanded === stock.id;
            const studied = portfolio.studied.includes(stock.symbol);
            const positive = stock.yearReturnPct >= 0;

            return (
              <div key={stock.id}>
                <button
                  onClick={() => study(stock)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-ink">{stock.symbol}</span>
                      {studied && <Check className="h-3 w-3 shrink-0 text-positive" />}
                    </div>
                    <p className="truncate text-2xs text-faint">
                      {stock.name} · {stock.sector}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabnum text-ink">
                      {formatCurrency(stock.referencePrice)}
                    </p>
                    <p
                      className={cn(
                        'flex items-center justify-end gap-0.5 text-2xs font-medium tabnum',
                        positive ? 'text-positive' : 'text-negative'
                      )}
                    >
                      {positive ? (
                        <TrendingUp className="h-2.5 w-2.5" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5" />
                      )}
                      {positive ? '+' : ''}
                      {stock.yearReturnPct}% / yr
                    </p>
                  </div>
                </button>

                {isOpen && (
                  <div className="animate-fade-up space-y-3 border-t border-line bg-surface px-4 py-3.5">
                    <div>
                      <p className="eyebrow flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" />
                        Concept: {stock.concept}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {stock.conceptExplainer}
                      </p>
                    </div>

                    <div>
                      <p className="eyebrow">Why this company matters</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{stock.lesson}</p>
                    </div>

                    <div className="flex items-end gap-2 border-t border-line pt-3">
                      <div className="flex-1">
                        <p className="eyebrow mb-1">Allocate virtual cash</p>
                        <MoneyInput
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          placeholder="1000"
                          className="h-8"
                        />
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => buy(stock)}
                        disabled={!Number(buyAmount) || Number(buyAmount) > portfolio.cash}
                      >
                        Invest
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};
