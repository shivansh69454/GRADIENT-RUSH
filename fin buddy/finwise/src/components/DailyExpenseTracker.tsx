'use client';

import React, { useState, useEffect } from 'react';
import { DailyExpense } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DailyExpenseTrackerProps {
  onExpenseAdded?: () => void;
}

export default function DailyExpenseTracker({ onExpenseAdded }: DailyExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food & Dining');

  useEffect(() => {
    // Load today's expenses
    const today = new Date().toISOString().split('T')[0];
    const savedExpenses = localStorage.getItem('finwise_daily_expenses');
    if (savedExpenses) {
      const allExpenses: DailyExpense[] = JSON.parse(savedExpenses);
      const todayExpenses = allExpenses.filter(e => e.date === today);
      setExpenses(todayExpenses);
    }
  }, []);

  const handleAddExpense = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const today = new Date().toISOString().split('T')[0];
    const newExpense: DailyExpense = {
      id: `expense_${Date.now()}`,
      amount: parseFloat(amount),
      description: description.trim() || category, // Use category if no description
      category,
      date: today,
      timestamp: Date.now(),
    };

    // Add to today's expenses
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);

    // Save to localStorage
    const savedExpenses = localStorage.getItem('finwise_daily_expenses');
    const allExpenses: DailyExpense[] = savedExpenses ? JSON.parse(savedExpenses) : [];
    allExpenses.push(newExpense);
    localStorage.setItem('finwise_daily_expenses', JSON.stringify(allExpenses));

    // Update weekly and monthly totals
    updateWeeklyMonthlyData(newExpense);

    // Notify parent component
    if (onExpenseAdded) {
      onExpenseAdded();
    }

    // Reset form
    setAmount('');
    setDescription('');
  };

  const updateWeeklyMonthlyData = (expense: DailyExpense) => {
    // Update weekly data
    const weekStart = getWeekStart(new Date(expense.date));
    const weeklyKey = `finwise_weekly_${weekStart}`;
    const weeklyData = localStorage.getItem(weeklyKey);
    const weekTotal = weeklyData ? parseFloat(weeklyData) + expense.amount : expense.amount;
    localStorage.setItem(weeklyKey, weekTotal.toString());

    // Update monthly data
    const monthKey = expense.date.substring(0, 7); // YYYY-MM
    const monthlyKey = `finwise_monthly_${monthKey}`;
    const monthlyData = localStorage.getItem(monthlyKey);
    const monthTotal = monthlyData ? parseFloat(monthlyData) + expense.amount : expense.amount;
    localStorage.setItem(monthlyKey, monthTotal.toString());
  };

  const getWeekStart = (date: Date): string => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const handleDeleteExpense = (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;

    // Remove from today's list
    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);

    // Remove from localStorage
    const savedExpenses = localStorage.getItem('finwise_daily_expenses');
    if (savedExpenses) {
      const allExpenses: DailyExpense[] = JSON.parse(savedExpenses);
      const filtered = allExpenses.filter(e => e.id !== id);
      localStorage.setItem('finwise_daily_expenses', JSON.stringify(filtered));
    }

    // Update weekly and monthly totals (subtract)
    const weekStart = getWeekStart(new Date(expenseToDelete.date));
    const weeklyKey = `finwise_weekly_${weekStart}`;
    const weeklyData = localStorage.getItem(weeklyKey);
    if (weeklyData) {
      const newTotal = Math.max(0, parseFloat(weeklyData) - expenseToDelete.amount);
      localStorage.setItem(weeklyKey, newTotal.toString());
    }

    const monthKey = expenseToDelete.date.substring(0, 7);
    const monthlyKey = `finwise_monthly_${monthKey}`;
    const monthlyData = localStorage.getItem(monthlyKey);
    if (monthlyData) {
      const newTotal = Math.max(0, parseFloat(monthlyData) - expenseToDelete.amount);
      localStorage.setItem(monthlyKey, newTotal.toString());
    }
  };

  const todayTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categories = ['Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 'Other'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daily Expenses</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">Today's Total</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(todayTotal)}
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (e.g., Lunch at cafe)"
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
            />
            <button
              onClick={handleAddExpense}
              className="px-4 py-2 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white rounded-lg text-sm font-semibold hover:from-sky-500 hover:via-blue-500 hover:to-violet-500 transition-all"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <div className="text-4xl mb-2">💸</div>
            <p className="text-sm">No expenses added today</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {expense.description}
                  </p>
                  <span className="text-xs px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded">
                    {expense.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(expense.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {formatCurrency(expense.amount)}
                </span>
                <button
                  onClick={() => handleDeleteExpense(expense.id)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}