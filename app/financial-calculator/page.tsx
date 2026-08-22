'use client';

import React from 'react';
import EMICalculator from '@/components/EMICalculator';
import SIPCalculator from '@/components/SIPCalculator';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const FinancialCalculatorPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200">
          <div className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 group-hover:bg-white dark:group-hover:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 shadow-sm transition-all duration-200 group-hover:-translate-x-0.5">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Financial Calculators
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* EMI Calculator Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
            EMI Calculator
          </h2>
          <EMICalculator />
        </div>

        {/* SIP Calculator Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
            SIP Calculator
          </h2>
          <SIPCalculator />
        </div>
      </div>
    </div>
  );
};

export default FinancialCalculatorPage;