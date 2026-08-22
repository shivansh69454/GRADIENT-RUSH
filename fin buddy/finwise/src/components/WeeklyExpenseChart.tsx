'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface WeeklyExpenseChartProps {
  refreshTrigger?: number;
}

export default function WeeklyExpenseChart({ refreshTrigger }: WeeklyExpenseChartProps) {
  const [weekTotal, setWeekTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);

  useEffect(() => {
    loadWeeklyData();
  }, [refreshTrigger]);

  const getWeekStart = (date: Date): string => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const loadWeeklyData = () => {
    const today = new Date();
    const weekStart = getWeekStart(new Date(today));
    const monthKey = today.toISOString().substring(0, 7);

    // Load weekly data from daily expenses
    const weeklyKey = `finwise_weekly_${weekStart}`;
    const weeklyTotal = localStorage.getItem(weeklyKey);
    let weekTotal = weeklyTotal ? parseFloat(weeklyTotal) : 0;

    // Load monthly data from daily expenses
    const monthlyKey = `finwise_monthly_${monthKey}`;
    const monthlyTotal = localStorage.getItem(monthlyKey);
    let monthTotal = monthlyTotal ? parseFloat(monthlyTotal) : 0;

    // Add expense splitter group expenses to totals
    const groupsData = localStorage.getItem('finwise_expense_groups');
    if (groupsData) {
      const groups = JSON.parse(groupsData);
      const expensesData = localStorage.getItem('finwise_group_expenses');
      if (expensesData) {
        const allGroupExpenses = JSON.parse(expensesData);
        
        // Filter expenses for this week
        allGroupExpenses.forEach((expense: any) => {
          const expenseDate = new Date(expense.date);
          const expenseWeekStart = getWeekStart(new Date(expenseDate));
          const expenseMonthKey = expenseDate.toISOString().substring(0, 7);
          
          // Add to week total if in current week
          if (expenseWeekStart === weekStart) {
            weekTotal += expense.amount;
          }
          
          // Add to month total if in current month
          if (expenseMonthKey === monthKey) {
            monthTotal += expense.amount;
          }
        });
      }
    }

    setWeekTotal(weekTotal);
    setMonthTotal(monthTotal);
  };

  const weekStartDate = getWeekStart(new Date());
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-green-200 dark:border-green-700">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Expenses</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {new Date(weekStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {weekEndDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <button 
          onClick={loadWeeklyData}
          className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-300 dark:border-rose-800">
          <div className="text-sm text-rose-600 dark:text-rose-400 mb-1">This Week</div>
          <div className="text-2xl font-bold text-rose-900 dark:text-rose-300">
            {formatCurrency(weekTotal)}
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-300 dark:border-emerald-800">
          <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">This Month</div>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">
            {formatCurrency(monthTotal)}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-800">
        <p className="text-xs text-amber-800 dark:text-amber-400">
          💡 <strong>Tip:</strong> Weekly expenses reset every Monday. Stay on track with your budget!
        </p>
      </div>
    </div>
  );
}