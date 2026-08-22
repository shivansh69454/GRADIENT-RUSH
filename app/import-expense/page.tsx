'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ParsedExpense {
  amount: number;
  merchant: string;
  category: string;
  date: string;
}

export default function ImportExpensePage() {
  const router = useRouter();
  const [smsText, setSmsText] = useState('');
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const parseUPIMessage = (text: string): ParsedExpense[] => {
    const expenses: ParsedExpense[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Common UPI message patterns
      const patterns = [
        /(?:Rs\.?|INR|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
        /(?:debited|spent|paid)\s+(?:Rs\.?|INR|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
        /(\d+(?:,\d+)*(?:\.\d+)?)\s+(?:Rs\.?|INR|₹)/i,
      ];

      let amount = 0;
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          amount = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }

      if (amount > 0) {
        // Extract merchant name
        let merchant = 'Unknown Merchant';
        const merchantPatterns = [
          /(?:to|at)\s+([A-Za-z0-9\s]+?)(?:\s+on|\s+for|\s+UPI|$)/i,
          /VPA:\s*([A-Za-z0-9@._-]+)/i,
        ];

        for (const pattern of merchantPatterns) {
          const match = line.match(pattern);
          if (match) {
            merchant = match[1].trim();
            break;
          }
        }

        // Auto-categorize based on merchant
        let category = 'Other';
        const merchantLower = merchant.toLowerCase();
        
        if (merchantLower.includes('swiggy') || merchantLower.includes('zomato') || merchantLower.includes('uber') || merchantLower.includes('ola')) {
          category = 'Food';
        } else if (merchantLower.includes('amazon') || merchantLower.includes('flipkart') || merchantLower.includes('myntra')) {
          category = 'Shopping';
        } else if (merchantLower.includes('netflix') || merchantLower.includes('prime') || merchantLower.includes('spotify')) {
          category = 'Entertainment';
        } else if (merchantLower.includes('uber') || merchantLower.includes('ola') || merchantLower.includes('metro') || merchantLower.includes('bus')) {
          category = 'Transport';
        } else if (merchantLower.includes('electricity') || merchantLower.includes('water') || merchantLower.includes('gas')) {
          category = 'Bills';
        }

        expenses.push({
          amount,
          merchant,
          category,
          date: new Date().toISOString().split('T')[0],
        });
      }
    }

    return expenses;
  };

  const handleParse = () => {
    setLoading(true);
    setTimeout(() => {
      const parsed = parseUPIMessage(smsText);
      setParsedExpenses(parsed);
      setLoading(false);
    }, 500);
  };

  const handleImport = () => {
    if (parsedExpenses.length === 0) return;

    // Get existing daily expenses
    const existingExpenses = JSON.parse(localStorage.getItem('finwise_daily_expenses') || '[]');

    // Add parsed expenses
    parsedExpenses.forEach(expense => {
      const newExpense = {
        id: `expense-${Date.now()}-${Math.random()}`,
        category: expense.category,
        amount: expense.amount,
        description: `Payment to ${expense.merchant}`,
        date: expense.date,
      };
      existingExpenses.push(newExpense);
    });

    localStorage.setItem('finwise_daily_expenses', JSON.stringify(existingExpenses));

    // Update weekly and monthly data
    updateWeeklyMonthlyData(parsedExpenses);

    setSuccess(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const updateWeeklyMonthlyData = (expenses: ParsedExpense[]) => {
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const weekKey = `finwise_weekly_${startOfWeek.toISOString().split('T')[0]}`;

      const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const monthKey = `finwise_monthly_${month}`;

      // Update weekly
      const weeklyData = JSON.parse(localStorage.getItem(weekKey) || '{"total": 0, "expenses": []}');
      weeklyData.total += expense.amount;
      weeklyData.expenses.push({
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
      });
      localStorage.setItem(weekKey, JSON.stringify(weeklyData));

      // Update monthly
      const monthlyData = JSON.parse(localStorage.getItem(monthKey) || '{"total": 0, "expenses": []}');
      monthlyData.total += expense.amount;
      monthlyData.expenses.push({
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
      });
      localStorage.setItem(monthKey, JSON.stringify(monthlyData));
    });
  };

  const exampleSMS = `Dear Customer, Rs 450.00 debited from A/c XX1234 on 24-Dec-24 to VPA swiggy@paytm UPI:440123456789. Not you? Call 1800xxx.

Dear Customer, INR 1200 paid to Amazon Pay on 24-Dec-24 via UPI. Not you? Contact support.`;

  return (
    <div className="min-h-screen pb-8 px-4 md:px-6 max-w-4xl mx-auto">
      <div className="mb-6 pt-6">
        <Link href="/dashboard" className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200 mb-4">
          <div className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 group-hover:bg-white dark:group-hover:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 shadow-sm transition-all duration-200 group-hover:-translate-x-0.5">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back</span>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📱 Import UPI Expenses
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Paste your UPI SMS messages to automatically import expenses
        </p>
      </div>

      {success ? (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
            Expenses Imported Successfully!
          </h2>
          <p className="text-green-600 dark:text-green-500">
            {parsedExpenses.length} expense{parsedExpenses.length !== 1 ? 's' : ''} added to your tracker
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <span>ℹ️</span> How to use:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-400 text-sm">
              <li>Copy your UPI transaction SMS messages</li>
              <li>Paste them in the text area below</li>
              <li>Click "Parse Messages" to extract expenses</li>
              <li>Review and click "Import to Tracker"</li>
            </ol>
          </div>

          {/* Example */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">Example SMS:</h4>
              <button
                onClick={() => setSmsText(exampleSMS)}
                className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
              >
                Use Example
              </button>
            </div>
            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {exampleSMS}
            </pre>
          </div>

          {/* SMS Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paste SMS Messages:
            </label>
            <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="Paste your UPI transaction SMS messages here..."
              className="w-full h-48 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-sky-500 dark:focus:border-indigo-400 focus:outline-none transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleParse}
            disabled={!smsText.trim() || loading}
            className="w-full bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Parsing...' : 'Parse Messages'}
          </button>

          {/* Parsed Results */}
          {parsedExpenses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Parsed Expenses ({parsedExpenses.length})
              </h3>
              
              <div className="space-y-3">
                {parsedExpenses.map((expense, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">
                          {expense.category === 'Food' && '🍔'}
                          {expense.category === 'Shopping' && '🛍️'}
                          {expense.category === 'Entertainment' && '🎬'}
                          {expense.category === 'Transport' && '🚗'}
                          {expense.category === 'Bills' && '💡'}
                          {expense.category === 'Other' && '💰'}
                        </span>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {expense.merchant}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {expense.category} • {expense.date}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">
                        -₹{expense.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleImport}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                ✓ Import {parsedExpenses.length} Expense{parsedExpenses.length !== 1 ? 's' : ''} to Tracker
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
