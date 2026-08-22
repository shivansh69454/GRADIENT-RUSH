'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Advisor {
  id: string;
  name: string;
  type: 'Investment Advisor' | 'Trader' | 'Portfolio Manager';
  sebiRegNo: string;
  verified: boolean;
  rating: number;
  clients: number;
  experience: string;
  specialization: string;
  monthlyPlan: number;
  annualPlan: number;
  annualDiscount: number;
  profitLoss: {
    month1: { profit: number; month: string };
    month2: { profit: number; month: string };
    month3: { profit: number; month: string };
  };
  returns: string;
  description: string;
}

export default function AdsPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('All');

  const advisors: Advisor[] = [
    {
      id: 'adv1',
      name: 'Wealth Masters Advisory',
      type: 'Investment Advisor',
      sebiRegNo: 'INA000012345',
      verified: true,
      rating: 4.8,
      clients: 2500,
      experience: '12 years',
      specialization: 'Equity & Mutual Funds',
      monthlyPlan: 2999,
      annualPlan: 29999,
      annualDiscount: 17,
      profitLoss: {
        month1: { profit: 12.5, month: 'Oct 2024' },
        month2: { profit: 8.3, month: 'Nov 2024' },
        month3: { profit: 15.7, month: 'Dec 2024' },
      },
      returns: '12-18% annually',
      description: 'Expert guidance in building diversified equity and mutual fund portfolios for long-term wealth creation.',
    },
    {
      id: 'adv2',
      name: 'ProTrade Analytics',
      type: 'Trader',
      sebiRegNo: 'INA000067890',
      verified: true,
      rating: 4.6,
      clients: 1800,
      experience: '8 years',
      specialization: 'Intraday & Swing Trading',
      monthlyPlan: 4999,
      annualPlan: 49999,
      annualDiscount: 17,
      profitLoss: {
        month1: { profit: 22.1, month: 'Oct 2024' },
        month2: { profit: -3.2, month: 'Nov 2024' },
        month3: { profit: 18.9, month: 'Dec 2024' },
      },
      returns: '15-25% annually',
      description: 'Advanced technical analysis and real-time trade signals for active traders looking for short-term gains.',
    },
    {
      id: 'adv3',
      name: 'Elite Portfolio Services',
      type: 'Portfolio Manager',
      sebiRegNo: 'INP000054321',
      verified: true,
      rating: 4.9,
      clients: 850,
      experience: '15 years',
      specialization: 'High Net Worth Portfolio Management',
      monthlyPlan: 9999,
      annualPlan: 99999,
      annualDiscount: 17,
      profitLoss: {
        month1: { profit: 14.2, month: 'Oct 2024' },
        month2: { profit: 10.5, month: 'Nov 2024' },
        month3: { profit: 16.8, month: 'Dec 2024' },
      },
      returns: '18-24% annually',
      description: 'Personalized portfolio management for HNIs with focus on wealth preservation and steady growth.',
    },
    {
      id: 'adv4',
      name: 'Value Investors Hub',
      type: 'Investment Advisor',
      sebiRegNo: 'INA000098765',
      verified: true,
      rating: 4.7,
      clients: 3200,
      experience: '10 years',
      specialization: 'Value Investing & Fundamentals',
      monthlyPlan: 1999,
      annualPlan: 19999,
      annualDiscount: 17,
      profitLoss: {
        month1: { profit: 9.8, month: 'Oct 2024' },
        month2: { profit: 11.2, month: 'Nov 2024' },
        month3: { profit: 13.5, month: 'Dec 2024' },
      },
      returns: '14-20% annually',
      description: 'Focus on fundamentally strong stocks with long-term value creation potential and minimal risk.',
    },
    {
      id: 'adv5',
      name: 'Options Pro Academy',
      type: 'Trader',
      sebiRegNo: 'INA000043210',
      verified: true,
      rating: 4.5,
      clients: 1500,
      experience: '7 years',
      specialization: 'Options & Derivatives',
      monthlyPlan: 5999,
      annualPlan: 59999,
      annualDiscount: 17,
      profitLoss: {
        month1: { profit: 28.4, month: 'Oct 2024' },
        month2: { profit: -5.1, month: 'Nov 2024' },
        month3: { profit: 31.2, month: 'Dec 2024' },
      },
      returns: '20-35% annually',
      description: 'Specialized strategies for options trading with focus on risk management and consistent profitability.',
    },
    {
      id: 'adv6',
      name: 'Dividend Growth Advisors',
      type: 'Investment Advisor',
      sebiRegNo: 'INA000076543',
      verified: true,
      rating: 4.8,
      clients: 2100,
      experience: '14 years',
      specialization: 'Dividend Stocks & Income Generation',
      monthlyPlan: 2499,
      annualPlan: 24999,
      annualDiscount: 17,
      profitLoss: {
        month1: { profit: 7.9, month: 'Oct 2024' },
        month2: { profit: 8.6, month: 'Nov 2024' },
        month3: { profit: 9.4, month: 'Dec 2024' },
      },
      returns: '10-15% annually + dividends',
      description: 'Build passive income through carefully selected dividend-paying stocks with strong fundamentals.',
    },
  ];

  const types = ['All', 'Investment Advisor', 'Trader', 'Portfolio Manager'];
  const filteredAdvisors = selectedType === 'All' 
    ? advisors 
    : advisors.filter(a => a.type === selectedType);

  return (
    <div className="min-h-screen pb-8 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="mb-6 pt-6">
        <Link href="/dashboard" className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200 mb-4">
          <div className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 group-hover:bg-white dark:group-hover:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 shadow-sm transition-all duration-200 group-hover:-translate-x-0.5">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back</span>
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📊 Financial Advisors & Services
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              SEBI-registered professionals to help grow your wealth
            </p>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            All advisors verified by SEBI ✓
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedType === type
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Advisors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAdvisors.map((advisor) => (
          <div
            key={advisor.id}
            className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-xl transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {advisor.name}
                  </h3>
                  {advisor.verified && (
                    <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>✓</span>
                      <span>SEBI</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {advisor.type} • SEBI Reg: {advisor.sebiRegNo}
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    ⭐ {advisor.rating}
                  </span>
                  <span>•</span>
                  <span>{advisor.clients.toLocaleString()} clients</span>
                  <span>•</span>
                  <span>{advisor.experience}</span>
                </div>
              </div>
            </div>

            {/* Specialization */}
            <div className="bg-sky-100 dark:bg-sky-900/20 rounded-lg px-3 py-2 mb-4">
              <p className="text-sm font-medium text-sky-900 dark:text-sky-300">
                🎯 {advisor.specialization}
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {advisor.description}
            </p>

            {/* P&L Statement */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>📈</span>
                Recent Performance (3 Months)
              </h4>
              <div className="space-y-2">
                {[advisor.profitLoss.month1, advisor.profitLoss.month2, advisor.profitLoss.month3].map((month, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{month.month}</span>
                    <span className={`text-sm font-bold ${month.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {month.profit >= 0 ? '+' : ''}{month.profit}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Returns:</span>
                  <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{advisor.returns}</span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly Plan</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{advisor.monthlyPlan.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">/month</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Save {advisor.annualDiscount}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Annual Plan</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{advisor.annualPlan.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">/year</p>
              </div>
            </div>

            {/* CTA Button */}
            <button className="w-full bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              Subscribe Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
