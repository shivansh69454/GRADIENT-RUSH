import React from 'react';
import DailyExpenseTracker from '@/components/DailyExpenseTracker';
import WeeklyExpenseChart from '@/components/WeeklyExpenseChart';
import StockWatchlist from '@/components/StockWatchlist';
import AmountLeftPanel from '@/components/AmountLeftPanel';
import SavingsGoals from '@/components/SavingsGoals';
import ExpenseSplitter from '@/components/ExpenseSplitter';
import WishlistTracker from '@/components/WishlistTracker';

const DashboardPage: React.FC = () => {
    const user = {
        monthly_allowance: 20000,
    };

    return (
        <div className="p-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome to FinWise! 👋
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Track your expenses, manage your budget, and achieve your financial goals.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-4 md:space-y-6">
                    <DailyExpenseTracker />
                </div>

                <div className="space-y-4 md:space-y-6">
                    <WeeklyExpenseChart />
                    <StockWatchlist />
                </div>

                <div className="space-y-4 md:space-y-6">
                    <AmountLeftPanel 
                        monthlyAllowance={user.monthly_allowance} 
                    />
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    🚀 Financial Tools
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    <div>
                        <SavingsGoals />
                    </div>
                    <div>
                        <ExpenseSplitter />
                    </div>
                    <div>
                        <WishlistTracker />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;