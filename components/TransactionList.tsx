'use client';

import React from 'react';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food & Dining':
        return '🍽️';
      case 'Rent & Utilities':
        return '🏠';
      case 'Shopping':
        return '🛍️';
      case 'Income':
        return '💰';
      default:
        return '📊';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Recent Transactions
      </h3>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="text-2xl">{getCategoryIcon(transaction.category)}</div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {transaction.merchant}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {transaction.category} • {formatDate(transaction.date)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p
                className={`font-bold ${
                  transaction.type === 'credit'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {transaction.type === 'credit' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
