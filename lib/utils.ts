// Utility functions for FinWise

import { LevelInfo } from '@/types';

const XP_PER_LEVEL = 1000; // Fixed XP required per level
const MAX_LEVEL = 100;

/**
 * Calculate player level based on total XP earned
 * Each level requires exactly 1000 XP
 * Level 1: 0 - 999 XP
 * Level 2: 1000 - 1999 XP
 * Level 100: 99000 - 99999 XP
 */
export const calculateLevel = (totalXP: number): number => {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  return Math.min(level, MAX_LEVEL);
};

/**
 * Get XP range for a specific level
 */
export const getLevelXPRange = (level: number): { min: number; max: number } => {
  const min = (level - 1) * XP_PER_LEVEL;
  const max = level * XP_PER_LEVEL - 1;
  return { min, max };
};

/**
 * Calculate progress percentage within current level
 */
export const calculateLevelProgress = (totalXP: number): number => {
  const xpInCurrentLevel = totalXP % XP_PER_LEVEL;
  const progress = (xpInCurrentLevel / XP_PER_LEVEL) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

/**
 * Get XP needed for next level
 */
export const getXPForNextLevel = (totalXP: number): number => {
  const currentLevel = calculateLevel(totalXP);
  if (currentLevel >= MAX_LEVEL) return 0;
  
  const nextLevelStart = currentLevel * XP_PER_LEVEL;
  return nextLevelStart - totalXP;
};

/**
 * Get current XP within the current level
 */
export const getCurrentLevelXP = (totalXP: number): number => {
  return totalXP % XP_PER_LEVEL;
};

/**
 * Get level title/rank based on level number
 */
export const getLevelTitle = (level: number): string => {
  if (level >= 90) return 'Financial Master';
  if (level >= 75) return 'Investment Guru';
  if (level >= 60) return 'Money Expert';
  if (level >= 45) return 'Budget Pro';
  if (level >= 30) return 'Savings Champion';
  if (level >= 15) return 'Finance Apprentice';
  return 'Finance Beginner';
};

/**
 * Get comprehensive level information
 */
export const getLevelInfo = (totalXP: number): LevelInfo => {
  const level = calculateLevel(totalXP);
  const { min, max } = getLevelXPRange(level);
  
  return {
    level,
    xpRequired: XP_PER_LEVEL,
    xpStart: min,
    xpEnd: max,
    title: getLevelTitle(level),
  };
};

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};
