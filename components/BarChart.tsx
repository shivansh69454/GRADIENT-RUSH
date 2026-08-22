'use client';

import React from 'react';

interface BarChartProps {
  data: Array<{
    label: string;
    income: number;
    expense: number;
  }>;
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expense)));

  return (
    <div className="flex items-end justify-between h-32 gap-3">
      {data.map((item, index) => {
        const incomeHeight = (item.income / maxValue) * 100;
        const expenseHeight = (item.expense / maxValue) * 100;

        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center gap-1 h-full">
              <div
                className="w-2 bg-primary-green rounded-t transition-all duration-500"
                style={{ height: `${incomeHeight}%` }}
              />
              <div
                className="w-2 bg-primary-purple rounded-t transition-all duration-500"
                style={{ height: `${expenseHeight}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};
