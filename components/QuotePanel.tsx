'use client';

import React from 'react';
import { getQuoteOfTheDay } from '@/lib/mockData';

export default function QuotePanel() {
  const quote = getQuoteOfTheDay();

  return (
    <div className="bg-gradient-to-br from-sky-100 to-lavender-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.01] border-2 border-sky-300 dark:border-sky-700">
      <div className="flex items-start gap-3 md:gap-4">
        {/* Quote Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>
        </div>

        {/* Quote Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-sky-600 dark:text-sky-400">
              💡 Daily Wisdom
            </h3>
          </div>
          
          <blockquote className="text-base font-medium text-gray-900 dark:text-white mb-3 leading-relaxed">
            "{quote.text}"
          </blockquote>
          
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-indigo-300 to-transparent dark:from-indigo-700" />
            <cite className="text-sm font-semibold text-sky-700 dark:text-sky-400 not-italic">
              — {quote.author}
            </cite>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 text-6xl opacity-10 pointer-events-none">
        💎
      </div>
    </div>
  );
}
