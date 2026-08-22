'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

export default function EMICalculator() {
  const [loanAmount, setLoanAmount] = useState('500000');
  const [interestRate, setInterestRate] = useState('10');
  const [tenure, setTenure] = useState('12');
  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    calculateEMI();
  }, [loanAmount, interestRate, tenure]);

  const calculateEMI = () => {
    const principal = parseFloat(loanAmount) || 0;
    const rate = parseFloat(interestRate) / 12 / 100 || 0;
    const months = parseFloat(tenure) || 1;

    if (principal > 0 && rate > 0 && months > 0) {
      // EMI Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
      const emiValue = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
      const totalPayment = emiValue * months;
      const totalInt = totalPayment - principal;

      setEmi(emiValue);
      setTotalInterest(totalInt);
      setTotalAmount(totalPayment);
    } else {
      setEmi(0);
      setTotalInterest(0);
      setTotalAmount(0);
    }
  };

  const principalPercentage = loanAmount ? (parseFloat(loanAmount) / totalAmount) * 100 : 0;
  const interestPercentage = 100 - principalPercentage;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">EMI Calculator</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Calculate your loan EMI
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        {/* Loan Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Loan Amount
            </label>
            <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
              {formatCurrency(parseFloat(loanAmount) || 0)}
            </span>
          </div>
          <input
            type="range"
            min="10000"
            max="10000000"
            step="10000"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
          />
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className="w-full mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Interest Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Interest Rate (% per annum)
            </label>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {parseFloat(interestRate).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-600"
          />
          <input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            step="0.1"
            className="w-full mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Tenure */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tenure (Months)
            </label>
            <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
              {tenure} months ({(parseFloat(tenure) / 12).toFixed(1)} years)
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="360"
            step="6"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-pink-600"
          />
          <input
            type="number"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            className="w-full mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* EMI Result */}
      <div className="mb-6 p-6 bg-gradient-to-br from-sky-100 to-lavender-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-sky-300 dark:border-sky-700">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Monthly EMI</div>
          <div className="text-4xl font-bold text-sky-600 dark:text-sky-400 mb-4">
            {formatCurrency(emi)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Principal</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(parseFloat(loanAmount) || 0)}
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Interest</div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(totalInterest)}
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Amount</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Breakdown */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Payment Breakdown
        </div>
        <div className="flex h-8 rounded-lg overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold"
            style={{ width: `${principalPercentage}%` }}
          >
            {principalPercentage > 15 && `${principalPercentage.toFixed(0)}%`}
          </div>
          <div
            className="bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-semibold"
            style={{ width: `${interestPercentage}%` }}
          >
            {interestPercentage > 15 && `${interestPercentage.toFixed(0)}%`}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-sky-1000 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Principal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Interest</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-400">
          💡 <strong>Tip:</strong> Lower tenure means higher EMI but less interest paid overall!
        </p>
      </div>
    </div>
  );
}
