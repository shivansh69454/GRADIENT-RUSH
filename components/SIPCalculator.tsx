'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

export default function SIPCalculator() {
  const [monthlyInvestment, setMonthlyInvestment] = useState('5000');
  const [expectedReturn, setExpectedReturn] = useState('12');
  const [timePeriod, setTimePeriod] = useState('60');
  const [futureValue, setFutureValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);

  useEffect(() => {
    calculateSIP();
  }, [monthlyInvestment, expectedReturn, timePeriod]);

  const calculateSIP = () => {
    const monthly = parseFloat(monthlyInvestment) || 0;
    const rate = parseFloat(expectedReturn) / 12 / 100 || 0;
    const months = parseFloat(timePeriod) || 1;

    if (monthly > 0 && rate > 0 && months > 0) {
      // SIP Formula: FV = P × ((1 + r)^n - 1) / r × (1 + r)
      const fv = monthly * (((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate));
      const invested = monthly * months;
      const returns = fv - invested;

      setFutureValue(fv);
      setTotalInvested(invested);
      setTotalReturns(returns);
    } else {
      setFutureValue(0);
      setTotalInvested(0);
      setTotalReturns(0);
    }
  };

  const investedPercentage = totalInvested ? (totalInvested / futureValue) * 100 : 0;
  const returnsPercentage = 100 - investedPercentage;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">SIP Calculator</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Systematic Investment Plan returns
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        {/* Monthly Investment */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Monthly Investment
            </label>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {formatCurrency(parseFloat(monthlyInvestment) || 0)}
            </span>
          </div>
          <input
            type="range"
            min="500"
            max="100000"
            step="500"
            value={monthlyInvestment}
            onChange={(e) => setMonthlyInvestment(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-green-600"
          />
          <input
            type="number"
            value={monthlyInvestment}
            onChange={(e) => setMonthlyInvestment(e.target.value)}
            className="w-full mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Expected Return */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Expected Return (% per annum)
            </label>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {parseFloat(expectedReturn).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
          />
          <input
            type="number"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            step="0.1"
            className="w-full mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Time Period */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Period (Months)
            </label>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {timePeriod} months ({(parseFloat(timePeriod) / 12).toFixed(1)} years)
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="360"
            step="6"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-600"
          />
          <input
            type="number"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="w-full mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* SIP Result */}
      <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border-2 border-green-300 dark:border-green-700">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Maturity Value</div>
          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-4">
            {formatCurrency(futureValue)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Invested</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalInvested)}
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Estimated Returns</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalReturns)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Breakdown */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Investment Breakdown
        </div>
        <div className="flex h-8 rounded-lg overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold"
            style={{ width: `${investedPercentage}%` }}
          >
            {investedPercentage > 15 && `${investedPercentage.toFixed(0)}%`}
          </div>
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-semibold"
            style={{ width: `${returnsPercentage}%` }}
          >
            {returnsPercentage > 15 && `${returnsPercentage.toFixed(0)}%`}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Invested</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Returns</span>
          </div>
        </div>
      </div>

      {/* Wealth Growth Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-sky-100 to-lavender-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-sky-300 dark:border-sky-700">
          <div className="text-xs text-sky-600 dark:text-sky-400">ROI</div>
          <div className="text-lg font-bold text-sky-900 dark:text-sky-300">
            {totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-xs text-orange-600 dark:text-orange-400">Wealth Gain</div>
          <div className="text-lg font-bold text-orange-900 dark:text-orange-300">
            {totalInvested > 0 ? (futureValue / totalInvested).toFixed(1) : 0}x
          </div>
        </div>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-400">
          💡 <strong>Tip:</strong> Start early and stay invested for long-term wealth creation!
        </p>
      </div>
    </div>
  );
}
