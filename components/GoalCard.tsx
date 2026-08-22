'use client';

import React from 'react';

interface GoalCardProps {
  title: string;
  current: number;
  target: number;
  icon: string;
  color: string;
}

export const GoalCard: React.FC<GoalCardProps> = ({ title, current, target, icon, color }) => {
  const percentage = (current / target) * 100;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}20` }}
      >
        <span className="text-2xl">{icon}</span>
      </div>
      
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {formatCurrency(current)} of {formatCurrency(target)}
      </p>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};
