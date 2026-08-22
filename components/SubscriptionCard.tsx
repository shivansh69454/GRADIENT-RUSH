'use client';

import React from 'react';

interface SubscriptionCardProps {
  name: string;
  price: string;
  date: string;
  logo: React.ReactNode;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ name, price, date, logo }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center">
          {logo}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{date}</p>
        </div>
      </div>
      <p className="text-base font-semibold text-gray-900 dark:text-white">{price}</p>
    </div>
  );
};
