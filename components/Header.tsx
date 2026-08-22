'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X } from 'lucide-react';

interface Player {
  total_xp_earned: number;
}

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [player, setPlayer] = useState<Player | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadPlayer = () => {
      const stored = localStorage.getItem('finwise_player');
      if (stored) {
        setPlayer(JSON.parse(stored));
      }
    };

    loadPlayer();
    const interval = setInterval(loadPlayer, 2000);
    return () => clearInterval(interval);
  }, []);

  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 100) + 1;
  };

  const playerLevel = player ? calculateLevel(player.total_xp_earned) : 1;
  const discountPercentage = Math.min(Math.floor(playerLevel / 20) * 5, 25);
  const hasDiscount = discountPercentage > 0;

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-green-50/95 dark:bg-green-900/95 backdrop-blur-md border-b border-green-200 dark:border-green-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 via-pink-400 to-fuchsia-400 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">₹</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
              FinWise
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/50"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/dashboard')
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800/50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/financial-calculator"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/financial-calculator')
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800/50'
              }`}
            >
              Calculators
            </Link>
            <Link
              href="/courses"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/courses')
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800/50'
              }`}
            >
              Courses
            </Link>
            <Link
              href="/ads"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/ads')
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800/50'
              }`}
            >
              Advisors
            </Link>
            <Link
              href="/mentor"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/mentor')
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800/50'
              }`}
            >
              AI Mentor
            </Link>
          </nav>

          {/* Theme Toggle */}
          <div className="flex items-center gap-3">
            {hasDiscount && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-800 rounded-lg text-sm font-semibold shadow-lg">
                <span>🎯 Level {playerLevel}</span>
                <span className="opacity-75">•</span>
                <span>{discountPercentage}% OFF</span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <nav className="px-2 pt-2 pb-3 space-y-1 border-t border-green-200 dark:border-green-700">
              <Link
                href="/dashboard"
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-all ${
                  isActive('/dashboard')
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/financial-calculator"
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-all ${
                  isActive('/financial-calculator')
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Calculators
              </Link>
              <Link
                href="/courses"
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-all ${
                  isActive('/courses')
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Courses
              </Link>
              <Link
                href="/ads"
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-all ${
                  isActive('/ads')
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Advisors
              </Link>
              <Link
                href="/mentor"
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-all ${
                  isActive('/mentor')
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                AI Mentor
              </Link>
              {hasDiscount && (
                <div className="mx-3 mt-2 px-3 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-800 rounded-lg text-sm font-semibold shadow-lg">
                  <span>🎯 Level {playerLevel}</span>
                  <span className="mx-2 opacity-75">•</span>
                  <span>{discountPercentage}% OFF</span>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
