'use client';

import React, { useState, useEffect } from 'react';
import { SharedGroup, SharedExpense, Balance } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function ExpenseSplitter() {
  const [groups, setGroups] = useState<SharedGroup[]>([]);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  
  const [newGroup, setNewGroup] = useState({
    name: '',
    members: '',
  });

  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    paidBy: '',
    category: 'Food & Dining',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedGroups = localStorage.getItem('finwise_shared_groups');
    const savedExpenses = localStorage.getItem('finwise_shared_expenses');
    
    if (savedGroups) setGroups(JSON.parse(savedGroups));
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim() || !newGroup.members.trim()) return;

    const members = newGroup.members.split(',').map(m => m.trim()).filter(m => m);
    if (members.length === 0) return;

    const group: SharedGroup = {
      id: `group_${Date.now()}`,
      name: newGroup.name.trim(),
      members,
      createdBy: members[0],
      createdAt: new Date().toISOString(),
    };

    const updatedGroups = [...groups, group];
    setGroups(updatedGroups);
    localStorage.setItem('finwise_shared_groups', JSON.stringify(updatedGroups));

    setNewGroup({ name: '', members: '' });
    setShowGroupForm(false);
    setSelectedGroup(group.id);
  };

  const handleAddExpense = () => {
    if (!selectedGroup || !newExpense.amount || !newExpense.description.trim() || !newExpense.paidBy) {
      return;
    }

    const group = groups.find(g => g.id === selectedGroup);
    if (!group) return;

    const expense: SharedExpense = {
      id: `expense_${Date.now()}`,
      groupId: selectedGroup,
      amount: parseFloat(newExpense.amount),
      description: newExpense.description.trim(),
      paidBy: newExpense.paidBy,
      splitAmong: group.members,
      category: newExpense.category,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    };

    const updatedExpenses = [...expenses, expense];
    setExpenses(updatedExpenses);
    localStorage.setItem('finwise_shared_expenses', JSON.stringify(updatedExpenses));

    // Add to personal expenses if user paid
    const currentUser = group.members[0]; // Assume first member is current user
    if (expense.paidBy === currentUser) {
      const personalExpense = {
        id: `personal_${Date.now()}`,
        amount: expense.amount,
        description: `Paid for: ${expense.description} (Split expense)`,
        category: expense.category,
        date: expense.date,
        timestamp: expense.timestamp,
      };
      
      const savedExpenses = localStorage.getItem('finwise_daily_expenses');
      const allExpenses = savedExpenses ? JSON.parse(savedExpenses) : [];
      allExpenses.push(personalExpense);
      localStorage.setItem('finwise_daily_expenses', JSON.stringify(allExpenses));
    }

    setNewExpense({ amount: '', description: '', paidBy: '', category: 'Food & Dining' });
    setShowExpenseForm(false);
  };

  const calculateBalances = (groupId: string): Balance[] => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];

    const groupExpenses = expenses.filter(e => e.groupId === groupId);
    const balances: { [key: string]: number } = {};

    // Initialize balances
    group.members.forEach(member => {
      balances[member] = 0;
    });

    // Calculate what each person owes/is owed
    groupExpenses.forEach(expense => {
      const sharePerPerson = expense.amount / expense.splitAmong.length;
      
      // The payer gets credit for the full amount
      balances[expense.paidBy] += expense.amount;
      
      // Everyone (including payer) owes their share
      expense.splitAmong.forEach(member => {
        balances[member] -= sharePerPerson;
      });
    });

    // Convert to simplified balance list
    const balanceList: Balance[] = [];
    const creditors: string[] = [];
    const debtors: string[] = [];

    Object.entries(balances).forEach(([person, amount]) => {
      if (amount > 0.01) creditors.push(person);
      if (amount < -0.01) debtors.push(person);
    });

    debtors.forEach(debtor => {
      creditors.forEach(creditor => {
        if (Math.abs(balances[debtor]) > 0.01 && balances[creditor] > 0.01) {
          const amount = Math.min(Math.abs(balances[debtor]), balances[creditor]);
          balanceList.push({
            from: debtor,
            to: creditor,
            amount,
          });
          balances[debtor] += amount;
          balances[creditor] -= amount;
        }
      });
    });

    return balanceList;
  };

  const handleSettle = (balance: Balance) => {
    // Mark settlement in localStorage
    const settlement = {
      id: `settlement_${Date.now()}`,
      groupId: selectedGroup,
      from: balance.from,
      to: balance.to,
      amount: balance.amount,
      settledAt: new Date().toISOString(),
    };

    const savedSettlements = localStorage.getItem('finwise_settlements');
    const settlements = savedSettlements ? JSON.parse(savedSettlements) : [];
    settlements.push(settlement);
    localStorage.setItem('finwise_settlements', JSON.stringify(settlements));

    alert(`💰 Settlement recorded! ${balance.from} paid ${balance.to} ${formatCurrency(balance.amount)}`);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Expenses will remain in your daily tracker.')) {
      return;
    }

    // Remove group
    const updatedGroups = groups.filter(g => g.id !== groupId);
    setGroups(updatedGroups);
    localStorage.setItem('finwise_shared_groups', JSON.stringify(updatedGroups));

    // Keep expenses in shared expenses (don't remove them)
    // User can manually delete individual expenses if needed
    
    // Clear selection if current group was deleted
    if (selectedGroup === groupId) {
      setSelectedGroup('');
    }
  };

  const currentGroup = groups.find(g => g.id === selectedGroup);
  const groupExpenses = expenses.filter(e => e.groupId === selectedGroup);
  const balances = selectedGroup ? calculateBalances(selectedGroup) : [];
  const totalGroupExpense = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Expense Splitter</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Share expenses with roommates
          </p>
        </div>
        <button
          onClick={() => setShowGroupForm(!showGroupForm)}
          className="px-4 py-2 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white rounded-lg text-sm font-semibold hover:from-sky-500 hover:via-blue-500 hover:to-violet-500 transition-all"
        >
          {showGroupForm ? '✕ Cancel' : '+ New Group'}
        </button>
      </div>

      {/* Create Group Form */}
      {showGroupForm && (
            <div className="mb-4 p-4 bg-gradient-to-br from-sky-100 to-lavender-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-sky-300 dark:border-sky-700">
          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              placeholder="Group name (e.g., Room 101)"
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newGroup.members}
              onChange={(e) => setNewGroup({ ...newGroup, members: e.target.value })}
              placeholder="Members (comma separated: You, Rahul, Priya)"
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateGroup}
              className="w-full px-4 py-2 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white rounded-lg text-sm font-semibold hover:from-sky-500 hover:via-blue-500 hover:to-violet-500 transition-all"
            >
              Create Group
            </button>
          </div>
        </div>
      )}

      {/* Group Selector */}
      {groups.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setNewExpense({ ...newExpense, paidBy: '' });
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a group...</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.members.length} members)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected Group View */}
      {currentGroup && (
        <>
          {/* Group Info */}
          <div className="mb-4 p-4 bg-gradient-to-br from-sky-100 to-lavender-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-sky-300 dark:border-sky-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-900 dark:text-white">{currentGroup.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentGroup.members.length} members
                </span>
                <button
                  onClick={() => handleDeleteGroup(currentGroup.id)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  title="Delete group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {currentGroup.members.map((member, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded text-xs"
                >
                  {member}
                </span>
              ))}
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Group Expense</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalGroupExpense)}
              </div>
            </div>
          </div>

          {/* Add Expense Button */}
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            {showExpenseForm ? '✕ Cancel' : '+ Add Shared Expense'}
          </button>

          {/* Add Expense Form */}
          {showExpenseForm && (
            <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-300 dark:border-green-700">
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Description (e.g., Groceries)"
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="Total amount"
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <select
                    value={newExpense.paidBy}
                    onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Who paid?</option>
                    {currentGroup.members.map((member, idx) => (
                      <option key={idx} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Food & Dining</option>
                  <option>Groceries</option>
                  <option>Utilities</option>
                  <option>Entertainment</option>
                  <option>Transportation</option>
                  <option>Other</option>
                </select>
                <button
                  onClick={handleAddExpense}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  Add Expense
                </button>
              </div>
            </div>
          )}

          {/* Balances Section */}
          {balances.length > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">💰 Who Owes Whom</h4>
              <div className="space-y-2">
                {balances.map((balance, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {balance.from}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 mx-2">→</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {balance.to}
                      </span>
                      <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(balance.amount)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettle(balance)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                    >
                      Settle Up
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Expenses */}
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Recent Expenses</h4>
            {groupExpenses.length === 0 ? (
              <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
                No expenses yet
              </div>
            ) : (
              groupExpenses.slice().reverse().map((expense) => {
                const sharePerPerson = expense.amount / expense.splitAmong.length;
                return (
                  <div
                    key={expense.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {expense.description}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Paid by <span className="font-semibold">{expense.paidBy}</span> • {expense.category}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(sharePerPerson)}/person
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(expense.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {groups.length === 0 && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-sm">No groups yet</p>
          <p className="text-xs mt-1">Create a group to start splitting expenses</p>
        </div>
      )}
    </div>
  );
}