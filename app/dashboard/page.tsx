'use client';

import React, { useState, useEffect } from 'react';
import TaskPanel from '@/components/TaskPanel';
import QuotePanel from '@/components/QuotePanel';
import DailyExpenseTracker from '@/components/DailyExpenseTracker';
import WeeklyExpenseChart from '@/components/WeeklyExpenseChart';
import StockWatchlist from '@/components/StockWatchlist';
import AmountLeftPanel from '@/components/AmountLeftPanel';
import SavingsGoals from '@/components/SavingsGoals';
import ExpenseSplitter from '@/components/ExpenseSplitter';
import WishlistTracker from '@/components/WishlistTracker';
// EMI and SIP calculators moved to /financial-calculator
import { MOCK_PLAYER, generateTasksForAllowance } from '@/lib/mockData';
import { calculateLevel, getLevelInfo } from '@/lib/utils';
import { Player } from '@/types';
import FloatingMentor from '@/components/FloatingMentor';

export default function DashboardPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [weeklyRefreshTrigger, setWeeklyRefreshTrigger] = useState(0);

  useEffect(() => {
    // Load player data from localStorage
    const storedPlayer = localStorage.getItem('finwise_player');
    if (storedPlayer) {
      const playerData = JSON.parse(storedPlayer);
      setPlayer(playerData);
    } else {
      // Fallback to mock player
      setPlayer(MOCK_PLAYER);
    }
  }, []);

  // Persist player data whenever it changes
  useEffect(() => {
    if (player) {
      localStorage.setItem('finwise_player', JSON.stringify(player));
    }
  }, [player]);

  const handleTaskComplete = (taskId: string, xpEarned: number) => {
    if (!player) return;

    // Calculate new total XP
    const newTotalXP = player.total_xp_earned + xpEarned;
    
    // Make sure XP doesn't go negative
    const safeNewTotalXP = Math.max(0, newTotalXP);
    
    // Calculate new level based on total XP
    const newLevel = calculateLevel(safeNewTotalXP);
    const currentLevelXP = safeNewTotalXP % 1000; // XP within current level

    // Update player data
    const updatedPlayer: Player = {
      ...player,
      total_xp_earned: safeNewTotalXP,
      xp_points: currentLevelXP,
      level: newLevel,
    };

    setPlayer(updatedPlayer);
    localStorage.setItem('finwise_player', JSON.stringify(updatedPlayer));
    
    // Show level up notification if player leveled up
    if (newLevel > player.level && xpEarned > 0) {
      // You can add a toast notification here
      console.log(`🎉 Level Up! You're now level ${newLevel}!`);
    }
  };

  const handleExpenseAdded = () => {
    // Trigger weekly chart refresh
    setWeeklyRefreshTrigger(prev => prev + 1);
    
    // Auto-complete "Track an expense" task
    autoCompleteTask('track-expense');
  };

  const handleBudgetUpdate = (newBudget: number) => {
    if (!player) return;
    
    const updatedPlayer: Player = {
      ...player,
      monthly_allowance: newBudget,
    };
    
    setPlayer(updatedPlayer);
    localStorage.setItem('finwise_player', JSON.stringify(updatedPlayer));
  };

  // Auto-complete task function
  const autoCompleteTask = (taskKeyword: string) => {
    const tasks = localStorage.getItem('finwise_daily_tasks');
    if (!tasks) return;

    try {
      const taskList = JSON.parse(tasks);
      let taskCompleted = false;

      const updatedTasks = taskList.map((task: any) => {
        if (!task.completed && task.title.toLowerCase().includes(taskKeyword)) {
          taskCompleted = true;
          // Award XP
          handleTaskComplete(task.id, task.xp_reward);
          return { ...task, completed: true };
        }
        return task;
      });

      if (taskCompleted) {
        localStorage.setItem('finwise_daily_tasks', JSON.stringify(updatedTasks));
        // Trigger a small notification
        console.log(`✅ Task auto-completed!`);
      }
    } catch (error) {
      console.error('Error auto-completing task:', error);
    }
  };

  // Listen for course completion events
  useEffect(() => {
    const handleCourseComplete = () => {
      autoCompleteTask('complete');
    };

    window.addEventListener('courseCompleted', handleCourseComplete);
    return () => window.removeEventListener('courseCompleted', handleCourseComplete);
  }, [player]);

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const totalXP = player.total_xp_earned || 0;
  const levelInfo = getLevelInfo(totalXP);
  const currentLevel = calculateLevel(totalXP);
  const currentLevelXP = totalXP % 1000;
  const progressPercentage = (currentLevelXP / 1000) * 100;

  return (
    <div className="min-h-screen pb-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Player Level Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome, {player.name}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your progress and complete tasks to level up
            </p>
          </div>
          <div className="bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 text-white px-6 py-4 rounded-2xl shadow-lg">
            <div className="text-center">
              <div className="text-sm font-medium mb-1">Current Level</div>
              <div className="text-4xl font-bold mb-2">Level {currentLevel}</div>
              <div className="text-xs opacity-90">{levelInfo.title}</div>
              <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-xs mt-1">
                {currentLevelXP} / 1000 XP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Panel */}
      <div className="mb-6">
        <QuotePanel />
      </div>

      {/* Main Grid Layout - Responsive 3 Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
        
        {/* Left Column - Tasks and Expenses */}
        <div className="space-y-4 md:space-y-6">
          {/* Task Panel */}
          <TaskPanel 
            monthlyAllowance={player.monthly_allowance} 
            onTaskComplete={handleTaskComplete}
          />

          {/* Daily Expense Tracker */}
          <DailyExpenseTracker onExpenseAdded={handleExpenseAdded} />
        </div>

        {/* Middle Column - Charts and Stock */}
        <div className="space-y-4 md:space-y-6">
          {/* Weekly Expense Chart */}
          <WeeklyExpenseChart refreshTrigger={weeklyRefreshTrigger} />

          {/* Stock Watchlist */}
          <StockWatchlist />
        </div>

        {/* Right Column - Budget */}
        <div className="space-y-4 md:space-y-6 md:col-span-2 xl:col-span-1">
          {/* Amount Left to Spend */}
          <AmountLeftPanel 
            monthlyAllowance={player.monthly_allowance} 
            onBudgetUpdate={handleBudgetUpdate}
          />
        </div>
      </div>

      {/* New Features Section - Full Width */}
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🚀 Advanced Features
        </h2>
      </div>

      {/* Second Row - New Features - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
        
        {/* Savings Goals */}
        <div>
          <SavingsGoals />
        </div>

        {/* Expense Splitter */}
        <div>
          <ExpenseSplitter />
        </div>

        {/* Wishlist Tracker */}
        <div className="md:col-span-2 xl:col-span-1">
          <WishlistTracker />
        </div>
      </div>

      {/* Floating AI Mentor */}
      <FloatingMentor />
    </div>
  );
}
