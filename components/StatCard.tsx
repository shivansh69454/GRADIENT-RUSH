'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  chart?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, chart, action }) => {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300 border border-green-200 dark:border-green-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                vs last week
              </span>
            </div>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium"
          >
            {action.label}
          </button>
        )}
      </div>
      {chart && <div className="mt-4">{chart}</div>}
    </div>
  );
};
