'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import { generateTasksForAllowance } from '@/lib/mockData';

interface TaskPanelProps {
  monthlyAllowance: number;
  onTaskComplete: (taskId: string, xpEarned: number) => void;
}

export default function TaskPanel({ monthlyAllowance, onTaskComplete }: TaskPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Generate tasks based on allowance
    const generatedTasks = generateTasksForAllowance(monthlyAllowance);
    setTasks(generatedTasks);

    // Load completed tasks from localStorage
    const savedCompleted = localStorage.getItem('finwise_completed_tasks');
    if (savedCompleted) {
      try {
        const completed = JSON.parse(savedCompleted);
        const today = new Date().toISOString().split('T')[0];
        
        // Only load today's completed tasks
        if (completed.date === today) {
          setCompletedTasks(new Set(completed.taskIds));
        } else {
          // Reset for new day
          localStorage.removeItem('finwise_completed_tasks');
        }
      } catch (error) {
        console.error('Error loading completed tasks:', error);
      }
    }
  }, [monthlyAllowance]);

  const handleTaskToggle = (task: Task) => {
    const newCompleted = new Set(completedTasks);
    
    if (completedTasks.has(task.id)) {
      // Uncomplete task
      newCompleted.delete(task.id);
      onTaskComplete(task.id, -task.xp_reward); // Subtract XP
    } else {
      // Complete task
      newCompleted.add(task.id);
      onTaskComplete(task.id, task.xp_reward); // Add XP
    }
    
    setCompletedTasks(newCompleted);
    
    // Save to localStorage
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('finwise_completed_tasks', JSON.stringify({
      date: today,
      taskIds: Array.from(newCompleted)
    }));
  };

  const completedCount = completedTasks.size;
  const totalXP = completedCount * 50;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/50 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Tasks</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete tasks to earn XP and level up!
          </p>
        </div>
        <div className="text-center bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white px-4 py-2 rounded-xl">
          <div className="text-2xl font-bold">{totalXP}</div>
          <div className="text-xs">XP Today</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {completedCount}/{tasks.length} tasks
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isCompleted = completedTasks.has(task.id);
          
          return (
            <div
              key={task.id}
              className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                isCompleted
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-500'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/50 border-gray-200 dark:border-gray-700 hover:border-sky-500'
              }`}
              onClick={() => handleTaskToggle(task)}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 dark:border-gray-600 group-hover:border-sky-500'
                    }`}
                  >
                    {isCompleted && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        className={`font-semibold text-gray-900 dark:text-white ${
                          isCompleted ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p
                        className={`text-sm mt-1 text-gray-600 dark:text-gray-400 ${
                          isCompleted ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {task.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-2 py-1 rounded-lg text-xs font-bold">
                        <span>⭐</span>
                        <span>+{task.xp_reward} XP</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          task.difficulty === 'easy'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500'
                            : task.difficulty === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-500'
                        }`}
                      >
                        {task.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Category */}
                  {task.category && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        {task.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedCount === tasks.length && tasks.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-500">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🎉</div>
            <div>
              <h4 className="font-bold text-green-700 dark:text-green-500">
                All Tasks Complete!
              </h4>
              <p className="text-sm text-green-600 dark:text-green-400">
                Amazing work! You've earned {totalXP} XP today. Come back tomorrow for new challenges!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
