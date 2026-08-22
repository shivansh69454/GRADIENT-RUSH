'use client';

import React, { useState, useEffect } from 'react';
import { SavingsGoal } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    category: 'Electronics',
    icon: '📱',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = () => {
    const savedGoals = localStorage.getItem('finwise_savings_goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  };

  const categoryIcons = {
    'Electronics': '📱',
    'Travel': '✈️',
    'Education': '📚',
    'Gaming': '🎮',
    'Fashion': '👕',
    'Gadgets': '⌚',
    'Bike': '🏍️',
    'Other': '🎯',
  };

  const handleAddGoal = () => {
    if (!newGoal.name.trim() || !newGoal.targetAmount || parseFloat(newGoal.targetAmount) <= 0) {
      return;
    }

    const goal: SavingsGoal = {
      id: `goal_${Date.now()}`,
      name: newGoal.name.trim(),
      targetAmount: parseFloat(newGoal.targetAmount),
      savedAmount: 0,
      category: newGoal.category,
      icon: newGoal.icon,
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    localStorage.setItem('finwise_savings_goals', JSON.stringify(updatedGoals));

    setNewGoal({ name: '', targetAmount: '', category: 'Electronics', icon: '📱' });
    setShowAddForm(false);
  };

  const handleAddMoney = (goalId: string, amount: number) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          savedAmount: Math.min(goal.savedAmount + amount, goal.targetAmount),
        };
      }
      return goal;
    });

    setGoals(updatedGoals);
    localStorage.setItem('finwise_savings_goals', JSON.stringify(updatedGoals));
  };

  const handleDeleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    setGoals(updatedGoals);
    localStorage.setItem('finwise_savings_goals', JSON.stringify(updatedGoals));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Savings Goals</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Save for your favorite things
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
        >
          {showAddForm ? '✕ Cancel' : '+ Add Goal'}
        </button>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-300 dark:border-green-700">
          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              placeholder="Goal name (e.g., New iPhone)"
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                placeholder="Target amount"
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({ 
                  ...newGoal, 
                  category: e.target.value,
                  icon: categoryIcons[e.target.value as keyof typeof categoryIcons]
                })}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {Object.keys(categoryIcons).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddGoal}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              Create Goal
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-sm">No savings goals yet</p>
            <p className="text-xs mt-1">Add a goal to start saving</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = (goal.savedAmount / goal.targetAmount) * 100;
            const remaining = goal.targetAmount - goal.savedAmount;
            const isCompleted = goal.savedAmount >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isCompleted
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-500 dark:border-green-600'
                    : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{goal.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {goal.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {goal.category}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatCurrency(goal.savedAmount)} saved
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Amount Info */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Target</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(goal.targetAmount)}
                    </div>
                  </div>
                  {!isCompleted && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Remaining</div>
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(remaining)}
                      </div>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold">
                      🎉 Goal Achieved!
                    </div>
                  )}
                </div>

                {/* Add Money Buttons */}
                {!isCompleted && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAddMoney(goal.id, 100)}
                        className="px-2 py-2 bg-sky-500 text-white rounded-lg text-xs font-semibold hover:bg-sky-600 hover:scale-105 transition-all"
                      >
                        + ₹100
                      </button>
                      <button
                        onClick={() => handleAddMoney(goal.id, 500)}
                        className="px-2 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 hover:scale-105 transition-all"
                      >
                        + ₹500
                      </button>
                      <button
                        onClick={() => handleAddMoney(goal.id, 1000)}
                        className="px-2 py-2 bg-pink-600 text-white rounded-lg text-xs font-semibold hover:bg-pink-700 hover:scale-105 transition-all"
                      >
                        + ₹1K
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAddMoney(goal.id, 10000)}
                        className="px-2 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-xs font-semibold hover:from-green-700 hover:to-emerald-700 hover:scale-105 transition-all"
                      >
                        + ₹10K
                      </button>
                      <button
                        onClick={() => handleAddMoney(goal.id, 100000)}
                        className="px-2 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg text-xs font-semibold hover:from-orange-700 hover:to-red-700 hover:scale-105 transition-all"
                      >
                        + ₹1L
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {goals.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-400">
            💡 <strong>Tip:</strong> Set realistic goals and save regularly to achieve them faster!
          </p>
        </div>
      )}
    </div>
  );
}