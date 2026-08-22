'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus, QrCode, Send, Trash2, UserPlus, Users, X } from 'lucide-react';
import { Panel, PanelBody, PanelHeader, EmptyState } from '@/components/ui/Panel';
import { Button, IconButton } from '@/components/ui/Button';
import { FieldShell, Input, MoneyInput, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/contexts/AppContext';
import { CATEGORIES } from '@/lib/categories';
import {
  getGroupExpenses,
  getGroups,
  getSettlements,
  setGroupExpenses,
  setGroups,
  setSettlements,
} from '@/lib/storage';
import type { Balance, SharedExpense, SharedGroup, Settlement } from '@/types';
import { cn, formatCurrency, getTodayDate, uid } from '@/lib/utils';

/**
 * Nets everyone's position down to the fewest transfers.
 *
 * Splitwise-style greedy settlement: match the biggest debtor against the
 * biggest creditor until everything balances, so four people owing each other
 * money resolve in two payments rather than six.
 */
const settleUp = (
  group: SharedGroup,
  expenses: SharedExpense[],
  settlements: Settlement[]
): Balance[] => {
  const net = new Map<string, number>();
  group.members.forEach((m) => net.set(m, 0));

  expenses.forEach((expense) => {
    const share = expense.amount / Math.max(1, expense.splitAmong.length);
    net.set(expense.paidBy, (net.get(expense.paidBy) ?? 0) + expense.amount);
    expense.splitAmong.forEach((member) => {
      net.set(member, (net.get(member) ?? 0) - share);
    });
  });

  settlements.forEach((s) => {
    net.set(s.from, (net.get(s.from) ?? 0) + s.amount);
    net.set(s.to, (net.get(s.to) ?? 0) - s.amount);
  });

  const debtors = Array.from(net.entries())
    .filter(([, value]) => value < -0.5)
    .map(([name, value]) => ({ name, amount: -value }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Array.from(net.entries())
    .filter(([, value]) => value > 0.5)
    .map(([name, value]) => ({ name, amount: value }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Balance[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.5) {
      transfers.push({ from: debtors[i].name, to: creditors[j].name, amount });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.5) i += 1;
    if (creditors[j].amount < 0.5) j += 1;
  }
  return transfers;
};

const QRModal: React.FC<{
  balance: Balance | null;
  groupName: string;
  onClose: () => void;
}> = ({ balance, groupName, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!balance) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;

    const generate = async () => {
      const QRCode = (await import('qrcode')).default;
      // A UPI intent URI: any Indian payment app can open this directly.
      const payload = `upi://pay?pa=&pn=${encodeURIComponent(
        balance.to
      )}&am=${balance.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
        `${groupName} settlement via Smartwise`
      )}`;
      const url = await QRCode.toDataURL(payload, {
        width: 420,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#08090A', light: '#FFFFFF' },
      });
      if (!cancelled) setDataUrl(url);
    };

    void generate();
    return () => {
      cancelled = true;
    };
  }, [balance, groupName]);

  const whatsappUrl = balance
    ? `https://wa.me/?text=${encodeURIComponent(
        `Hey ${balance.from}! You owe me ${formatCurrency(balance.amount)} for ${groupName} 💸\n\nSettle up whenever. (via Smartwise)`
      )}`
    : '';

  return (
    <Modal
      open={Boolean(balance)}
      onClose={onClose}
      title="Settle up"
      subtitle={balance ? `${balance.from} → ${balance.to}` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => window.open(whatsappUrl, '_blank', 'noopener')}
            icon={<Send className="h-3.5 w-3.5" />}
          >
            Send on WhatsApp
          </Button>
        </>
      }
    >
      {balance && (
        <div className="space-y-4 p-4">
          <div className="text-center">
            <p className="eyebrow">Amount owed</p>
            <p className="text-3xl font-semibold tabnum text-ink">
              {formatCurrency(balance.amount)}
            </p>
          </div>

          <div className="flex justify-center">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt="UPI payment QR code"
                className="h-52 w-52 rounded-lg border border-line bg-white p-2"
              />
            ) : (
              <div className="h-52 w-52 skeleton rounded-lg" />
            )}
          </div>

          <p className="text-center text-2xs leading-relaxed text-muted">
            Scan with any UPI app to open a pre-filled payment for{' '}
            {formatCurrency(balance.amount)}. Add the payee&apos;s UPI ID in their app to complete
            the transfer.
          </p>
        </div>
      )}
    </Modal>
  );
};

export const ExpenseSplitter: React.FC = () => {
  const { player, awardXP, logExpense } = useApp();

  const [groups, setGroupsState] = useState<SharedGroup[]>([]);
  const [expenses, setExpensesState] = useState<SharedExpense[]>([]);
  const [settlements, setSettlementsState] = useState<Settlement[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);

  const [addingExpense, setAddingExpense] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState('Food');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  const [qrBalance, setQrBalance] = useState<Balance | null>(null);

  useEffect(() => {
    const loadedGroups = getGroups();
    setGroupsState(loadedGroups);
    setExpensesState(getGroupExpenses());
    setSettlementsState(getSettlements());
    if (loadedGroups.length > 0) setActiveId(loadedGroups[0].id);
  }, []);

  const active = groups.find((g) => g.id === activeId) ?? null;
  const activeExpenses = useMemo(
    () => expenses.filter((e) => e.groupId === activeId),
    [expenses, activeId]
  );
  const activeSettlements = useMemo(
    () => settlements.filter((s) => s.groupId === activeId),
    [settlements, activeId]
  );

  const balances = useMemo(
    () => (active ? settleUp(active, activeExpenses, activeSettlements) : []),
    [active, activeExpenses, activeSettlements]
  );

  const you = player.name || 'You';

  const createGroup = (event: React.FormEvent) => {
    event.preventDefault();
    if (!groupName.trim()) return;
    const all = Array.from(new Set([you, ...members])).filter(Boolean);
    if (all.length < 2) return;

    const group: SharedGroup = {
      id: uid('grp'),
      name: groupName.trim(),
      members: all,
      createdBy: you,
      createdAt: getTodayDate(),
    };
    const next = [...groups, group];
    setGroupsState(next);
    setGroups(next);
    setActiveId(group.id);
    awardXP(40, `Group created: ${group.name}`);

    setGroupName('');
    setMembers([]);
    setMemberInput('');
    setCreating(false);
  };

  const openExpenseForm = () => {
    if (!active) return;
    setPaidBy(you);
    setSplitAmong(active.members);
    setAddingExpense(true);
  };

  const addSharedExpense = (event: React.FormEvent) => {
    event.preventDefault();
    if (!active) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || splitAmong.length === 0) return;

    const expense: SharedExpense = {
      id: uid('shexp'),
      groupId: active.id,
      amount: value,
      description: description.trim() || 'Shared expense',
      paidBy,
      splitAmong,
      category,
      date: getTodayDate(),
      timestamp: Date.now(),
    };
    const next = [expense, ...expenses];
    setExpensesState(next);
    setGroupExpenses(next);

    // Your share flows into your personal ledger so budgets stay accurate.
    if (splitAmong.includes(you)) {
      logExpense({
        amount: value / splitAmong.length,
        description: `${expense.description} (${active.name})`,
        category,
        date: getTodayDate(),
        source: 'split',
      });
    }
    awardXP(20, 'Shared expense split', { silent: true });

    setAmount('');
    setDescription('');
    setAddingExpense(false);
  };

  const markSettled = (balance: Balance) => {
    if (!active) return;
    const settlement: Settlement = {
      id: uid('settle'),
      groupId: active.id,
      from: balance.from,
      to: balance.to,
      amount: balance.amount,
      settledAt: getTodayDate(),
    };
    const next = [...settlements, settlement];
    setSettlementsState(next);
    setSettlements(next);
    awardXP(15, 'Settled up', { silent: true });
  };

  const deleteGroup = (id: string) => {
    const nextGroups = groups.filter((g) => g.id !== id);
    const nextExpenses = expenses.filter((e) => e.groupId !== id);
    setGroupsState(nextGroups);
    setGroups(nextGroups);
    setExpensesState(nextExpenses);
    setGroupExpenses(nextExpenses);
    setActiveId(nextGroups[0]?.id ?? null);
  };

  return (
    <>
      <Panel>
        <PanelHeader
          title="Split & settle"
          subtitle={active ? `${active.members.length} people · ${active.name}` : 'Shared expenses'}
          icon={<Users className="h-3.5 w-3.5" />}
          action={
            <Button
              variant={creating ? 'ghost' : 'secondary'}
              size="sm"
              onClick={() => setCreating(!creating)}
              icon={creating ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            >
              {creating ? 'Cancel' : 'New group'}
            </Button>
          }
        />

        {creating && (
          <form
            onSubmit={createGroup}
            className="animate-fade-up space-y-3 border-b border-line bg-surface p-4"
          >
            <FieldShell label="Group name">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Goa trip, Flat 302, Sunday dinner"
                autoFocus
              />
            </FieldShell>

            <FieldShell label="Members" hint={`${you} is added automatically`}>
              <div className="flex gap-1.5">
                <Input
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const name = memberInput.trim();
                      if (name && !members.includes(name) && name !== you) {
                        setMembers([...members, name]);
                        setMemberInput('');
                      }
                    }
                  }}
                  placeholder="Add a name and press Enter"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const name = memberInput.trim();
                    if (name && !members.includes(name) && name !== you) {
                      setMembers([...members, name]);
                      setMemberInput('');
                    }
                  }}
                  icon={<UserPlus className="h-3.5 w-3.5" />}
                  className="shrink-0"
                />
              </div>
            </FieldShell>

            {(members.length > 0 || you) && (
              <div className="flex flex-wrap gap-1.5">
                <span className="chip chip-accent">{you} (you)</span>
                {members.map((member) => (
                  <button
                    key={member}
                    type="button"
                    onClick={() => setMembers(members.filter((m) => m !== member))}
                    className="chip transition-colors hover:border-negative/40 hover:text-negative"
                  >
                    {member}
                    <X className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={!groupName.trim() || members.length === 0}
            >
              Create group
            </Button>
          </form>
        )}

        {groups.length === 0 && !creating ? (
          <EmptyState
            icon="👥"
            title="No groups yet"
            description="Split dinner, rent, or a trip. Smartwise nets everything down to the fewest payments and hands you a QR to settle."
            action={
              <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
                Create a group
              </Button>
            }
          />
        ) : (
          groups.length > 0 && (
            <>
              {/* Group tabs */}
              <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 no-scrollbar">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveId(group.id)}
                    className={cn(
                      'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      group.id === activeId
                        ? 'bg-surface text-ink'
                        : 'text-muted hover:text-ink'
                    )}
                  >
                    {group.name}
                  </button>
                ))}
              </div>

              {active && (
                <PanelBody className="space-y-4">
                  {/* Who owes whom */}
                  {balances.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-positive/25 bg-positive/[0.05] px-3 py-2.5">
                      <Check className="h-4 w-4 shrink-0 text-positive" />
                      <p className="text-xs text-muted">
                        Everyone is square.{' '}
                        {activeExpenses.length > 0
                          ? 'All settled up.'
                          : 'Add an expense to get started.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="eyebrow">Settle up in {balances.length} payment
                        {balances.length === 1 ? '' : 's'}</p>
                      {balances.map((balance, index) => (
                        <div
                          key={`${balance.from}-${balance.to}-${index}`}
                          className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2"
                        >
                          <p className="min-w-0 flex-1 truncate text-xs text-muted">
                            <span className="font-medium text-ink">{balance.from}</span> owes{' '}
                            <span className="font-medium text-ink">{balance.to}</span>
                          </p>
                          <span className="shrink-0 text-sm font-semibold tabnum text-ink">
                            {formatCurrency(balance.amount)}
                          </span>
                          <IconButton
                            label="Show payment QR"
                            onClick={() => setQrBalance(balance)}
                            className="shrink-0 hover:text-accent"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </IconButton>
                          <IconButton
                            label="Mark as settled"
                            onClick={() => markSettled(balance)}
                            className="shrink-0 hover:text-positive"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </IconButton>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add expense */}
                  {addingExpense ? (
                    <form
                      onSubmit={addSharedExpense}
                      className="animate-fade-up space-y-3 rounded-lg border border-line bg-surface p-3"
                    >
                      <div className="flex gap-2">
                        <MoneyInput
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0"
                          className="w-28 shrink-0"
                          autoFocus
                        />
                        <Input
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="What was it?"
                          className="min-w-0 flex-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <FieldShell label="Paid by">
                          <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                            {active.members.map((member) => (
                              <option key={member} value={member}>
                                {member}
                              </option>
                            ))}
                          </Select>
                        </FieldShell>
                        <FieldShell label="Category">
                          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                            {CATEGORIES.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.emoji} {c.key}
                              </option>
                            ))}
                          </Select>
                        </FieldShell>
                      </div>

                      <FieldShell
                        label="Split among"
                        hint={
                          splitAmong.length > 0 && Number(amount) > 0
                            ? `${formatCurrency(Number(amount) / splitAmong.length)} each`
                            : undefined
                        }
                      >
                        <div className="flex flex-wrap gap-1.5">
                          {active.members.map((member) => {
                            const selected = splitAmong.includes(member);
                            return (
                              <button
                                key={member}
                                type="button"
                                onClick={() =>
                                  setSplitAmong(
                                    selected
                                      ? splitAmong.filter((m) => m !== member)
                                      : [...splitAmong, member]
                                  )
                                }
                                className={cn('chip', selected && 'chip-accent')}
                              >
                                {selected && <Check className="h-2.5 w-2.5" />}
                                {member}
                              </button>
                            );
                          })}
                        </div>
                      </FieldShell>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={!Number(amount) || splitAmong.length === 0}
                        >
                          Add expense
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAddingExpense(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={openExpenseForm}
                        icon={<Plus className="h-3.5 w-3.5" />}
                      >
                        Add shared expense
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGroup(active.id)}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                      >
                        Delete group
                      </Button>
                    </div>
                  )}

                  {/* Ledger */}
                  {activeExpenses.length > 0 && (
                    <div className="space-y-1 border-t border-line pt-3">
                      <p className="eyebrow">Recent</p>
                      {activeExpenses.slice(0, 6).map((expense) => (
                        <div key={expense.id} className="flex items-center gap-2 py-1">
                          <p className="min-w-0 flex-1 truncate text-xs text-ink">
                            {expense.description}
                          </p>
                          <p className="shrink-0 text-2xs text-faint">
                            {expense.paidBy} paid · {expense.splitAmong.length} way
                          </p>
                          <span className="shrink-0 text-xs font-semibold tabnum text-ink">
                            {formatCurrency(expense.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </PanelBody>
              )}
            </>
          )
        )}
      </Panel>

      <QRModal
        balance={qrBalance}
        groupName={active?.name ?? 'Smartwise'}
        onClose={() => setQrBalance(null)}
      />
    </>
  );
};
