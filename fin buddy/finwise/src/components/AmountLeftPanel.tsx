'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { CircularProgress } from './CircularProgress';

interface AmountLeftPanelProps {
  monthlyAllowance: number;
  onBudgetUpdate?: (newBudget: number) => void;
}

export default function AmountLeftPanel({ monthlyAllowance, onBudgetUpdate }: AmountLeftPanelProps) {
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(monthlyAllowance.toString());

  useEffect(() => {
    loadMonthlyData();
    const interval = setInterval(loadMonthlyData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMonthlyData = () => {
    const today = new Date();
    const monthKey = today.toISOString().substring(0, 7); // YYYY-MM
    const monthlyKey = `finwise_monthly_${monthKey}`;
    
    const monthlyTotal = localStorage.getItem(monthlyKey);
    let spent = monthlyTotal ? parseFloat(monthlyTotal) : 0;

    // Add expense splitter group expenses to total
    const groupExpensesData = localStorage.getItem('finwise_group_expenses');
    if (groupExpensesData) {
      const allGroupExpenses = JSON.parse(groupExpensesData);
      
      // Filter expenses for this month
      allGroupExpenses.forEach((expense: any) => {
        const expenseDate = new Date(expense.date);
        const expenseMonthKey = expenseDate.toISOString().substring(0, 7);
        
        // Add to month total if in current month
        if (expenseMonthKey === monthKey) {
          spent += expense.amount;
        }
      });
    }

    setMonthlySpent(spent);

    // Calculate daily average
    const dayOfMonth = today.getDate();
    const avg = spent / dayOfMonth;
    setDailyAverage(avg);
  };

  const handleSaveBudget = () => {
    const budget = parseFloat(newBudget);
    if (budget > 0 && onBudgetUpdate) {
      onBudgetUpdate(budget);
      setIsEditingBudget(false);
    }
  };

  const handleCancelEdit = () => {
    setNewBudget(monthlyAllowance.toString());
    setIsEditingBudget(false);
  };

  const amountLeft = monthlyAllowance - monthlySpent;
  const percentageSpent = (monthlySpent / monthlyAllowance) * 100;
  const percentageLeft = 100 - percentageSpent;
  
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - today.getDate();
  const dailyBudget = daysLeft > 0 ? amountLeft / daysLeft : 0;

  const isOverBudget = amountLeft < 0;
  const isWarning = percentageSpent > 80 && percentageSpent <= 100;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/50 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Budget Overview</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={loadMonthlyData}
          className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium"
        >
          🔄
        </button>
      </div>

      {/* Circular Progress */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <CircularProgress 
            percentage={Math.min(percentageLeft, 100)} 
            size={200} 
            strokeWidth={12} 
            color={isOverBudget ? '#EF4444' : isWarning ? '#F59E0B' : '#4ADE80'} 
          />
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div className={`text-3xl font-bold ${
              isOverBudget 
                ? 'text-red-600 dark:text-red-400' 
                : isWarning 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {percentageLeft > 0 ? percentageLeft.toFixed(0) : 0}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">remaining</div>
          </div>
        </div>
      </div>

      {/* Amount Left */}
      <div className="text-center mb-6">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Amount Left to Spend</div>
        <div className={`text-4xl font-bold ${
          isOverBudget 
            ? 'text-red-600 dark:text-red-400' 
            : isWarning 
            ? 'text-amber-600 dark:text-amber-400' 
            : 'text-green-600 dark:text-green-400'
        }`}>
          {formatCurrency(Math.max(0, amountLeft))}
        </div>
        {isOverBudget && (
          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
            Over budget by {formatCurrency(Math.abs(amountLeft))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-sky-100 to-lavender-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-sky-300 dark:border-sky-700">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-purple-600 dark:text-purple-400">Total Budget</div>
            {onBudgetUpdate && !isEditingBudget && (
              <button
                onClick={() => setIsEditingBudget(true)}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                title="Edit budget"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
          {isEditingBudget ? (
            <div className="flex gap-1">
              <input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <button
                onClick={handleSaveBudget}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                title="Save"
              >
                ✓
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="text-xl font-bold text-purple-900 dark:text-purple-300">
              {formatCurrency(monthlyAllowance)}
            </div>
          )}
        </div>
        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-300 dark:border-orange-700">
          <div className="text-xs text-red-600 dark:text-red-400 mb-1">Total Spent</div>
          <div className="text-xl font-bold text-red-900 dark:text-red-300">
            {formatCurrency(monthlySpent)}
          </div>
        </div>
      </div>

      {/* Daily Budget */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-500 dark:border-green-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-emerald-700 dark:text-emerald-400">Daily Budget Left</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-500">{daysLeft} days left</span>
        </div>
        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">
          {formatCurrency(Math.max(0, dailyBudget))}/day
        </div>
        <div className="text-xs text-emerald-700 dark:text-emerald-500 mt-1">
          Avg spent: {formatCurrency(dailyAverage)}/day
        </div>
      </div>

      {/* Warning Message */}
      {isWarning && !isOverBudget && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-700">
          <p className="text-xs text-amber-800 dark:text-amber-400">
            ⚠️ <strong>Warning:</strong> You've used {percentageSpent.toFixed(0)}% of your budget. Spend wisely!
          </p>
        </div>
      )}

      {isOverBudget && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-700">
          <p className="text-xs text-red-800 dark:text-red-400">
            🚨 <strong>Alert:</strong> You've exceeded your monthly budget. Review your expenses!
          </p>
        </div>
      )}
    </div>
  );
}