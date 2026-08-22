'use client';

import React from 'react';
import { calculateLevel, getLevelXPRange, calculateLevelProgress } from '@/lib/utils';

interface LevelDisplayProps {
  xp: number;
}

export const LevelDisplay: React.FC<LevelDisplayProps> = ({ xp }) => {
  const level = calculateLevel(xp);
  const { min, max } = getLevelXPRange(level);
  const progress = calculateLevelProgress(xp);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Level {level}
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Current XP</p>
          <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
            {xp} XP
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {xp - min} / {max - min} XP
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {max - xp} XP to Level {level + 1}
      </p>

      {/* Level Badge */}
      <div className="mt-4 flex items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-white">{level}</span>
          </div>
          <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-900"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
