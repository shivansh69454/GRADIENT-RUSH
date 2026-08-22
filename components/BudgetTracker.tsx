'use client';

import React from 'react';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface BudgetTrackerProps {
  transactions: Transaction[];
  monthlyLimit: number;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ transactions, monthlyLimit }) => {
  // Calculate total spent (debits only)
  const totalSpent = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const remaining = monthlyLimit - totalSpent;
  const percentageUsed = (totalSpent / monthlyLimit) * 100;

  const getStatusColor = () => {
    if (percentageUsed >= 90) return 'text-red-600 dark:text-red-400';
    if (percentageUsed >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressBarColor = () => {
    if (percentageUsed >= 90) return 'bg-red-500';
    if (percentageUsed >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Monthly Budget Tracker
      </h3>

      <div className="space-y-4">
        {/* Budget Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(monthlyLimit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Spent</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
            <p className={`text-lg font-bold ${getStatusColor()}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Budget Used</span>
            <span className={`text-sm font-semibold ${getStatusColor()}`}>
              {Math.round(percentageUsed)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor()} transition-all duration-500 ease-out`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Warning Message */}
        {percentageUsed >= 70 && (
          <div
            className={`p-3 rounded-lg ${
              percentageUsed >= 90
                ? 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800'
                : 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800'
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                percentageUsed >= 90
                  ? 'text-red-800 dark:text-red-300'
                  : 'text-yellow-800 dark:text-yellow-300'
              }`}
            >
              {percentageUsed >= 90
                ? '⚠️ Critical: You\'ve used over 90% of your monthly budget!'
                : '⚠️ Warning: You\'ve used over 70% of your monthly budget!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
