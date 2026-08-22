'use client';

import React, { useState, useEffect } from 'react';
import { Player } from '@/types';
import { useRouter } from 'next/navigation';
import FloatingMentor from '@/components/FloatingMentor';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  videoUrl: string;
  thumbnail: string;
  instructor: string;
  topics: string[];
  isCompleted: boolean;
  isPaid?: boolean;
  price?: number;
  earnings?: number; // For educators
}

interface PaidCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  instructor: string;
  instructorImage: string;
  thumbnail: string;
  duration: string;
  lessons: number;
  rating: number;
  students: number;
  category: string;
  isPurchased: boolean;
}

export default function CoursesPage() {
  const router = useRouter();
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [player, setPlayer] = useState<Player | null>(null);
  const [purchasedCourses, setPurchasedCourses] = useState<Set<string>>(new Set());
  const [showPayment, setShowPayment] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<PaidCourse | null>(null);
  const [activeTab, setActiveTab] = useState<'free' | 'paid'>('free');

  useEffect(() => {
    // Load player data
    const storedPlayer = localStorage.getItem('finwise_player');
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    }

    // Load completed courses
    const saved = localStorage.getItem('finwise_completed_courses');
    if (saved) {
      setCompletedCourses(new Set(JSON.parse(saved)));
    }

    // Load purchased courses
    const purchased = localStorage.getItem('finwise_purchased_courses');
    if (purchased) {
      setPurchasedCourses(new Set(JSON.parse(purchased)));
    }
  }, []);

  const courses: Course[] = [
    {
      id: 'course_1',
      title: 'Personal Finance Basics',
      description: 'Learn the fundamentals of managing your money, budgeting, and building wealth.',
      category: 'Beginner',
      duration: '45 min',
      videoUrl: 'https://www.youtube.com/watch?v=HQzoZfc3GwQ',
      thumbnail: '💰',
      instructor: 'Ali Abdaal',
      topics: ['Budgeting', 'Saving', 'Expense Tracking', 'Emergency Fund'],
      isCompleted: false,
    },
    {
      id: 'course_2',
      title: 'Understanding Stock Market',
      description: 'Complete beginner guide to stock market investing and equity trading.',
      category: 'Beginner',
      duration: '1h 20min',
      videoUrl: 'https://www.youtube.com/watch?v=p7HKvqRI_Bo',
      thumbnail: '📈',
      instructor: 'CA Rachana Ranade',
      topics: ['Stocks', 'Trading', 'Market Analysis', 'Portfolio'],
      isCompleted: false,
    },
    {
      id: 'course_3',
      title: 'Mutual Funds Explained',
      description: 'Everything you need to know about investing in mutual funds and SIPs.',
      category: 'Beginner',
      duration: '55 min',
      videoUrl: 'https://www.youtube.com/watch?v=X1qzuPRvsM0',
      thumbnail: '📊',
      instructor: 'Labour Law Advisor',
      topics: ['Mutual Funds', 'SIP', 'NAV', 'Fund Types'],
      isCompleted: false,
    },
    {
      id: 'course_4',
      title: 'Credit Cards & Credit Score',
      description: 'Master credit cards, build excellent credit score, and maximize rewards.',
      category: 'Intermediate',
      duration: '1h 10min',
      videoUrl: 'https://www.youtube.com/watch?v=SJY66D8XwhE',
      thumbnail: '💳',
      instructor: 'Akshat Shrivastava',
      topics: ['Credit Cards', 'CIBIL Score', 'Rewards', 'Debt Management'],
      isCompleted: false,
    },
    {
      id: 'course_5',
      title: 'Tax Saving Strategies',
      description: 'Learn how to save taxes legally using 80C, 80D and other deductions.',
      category: 'Intermediate',
      duration: '1h 5min',
      videoUrl: 'https://www.youtube.com/watch?v=qg8jhi7sbSw',
      thumbnail: '📝',
      instructor: 'CA Sahil Jain',
      topics: ['Income Tax', '80C Deductions', 'Tax Planning', 'Investments'],
      isCompleted: false,
    },
    {
      id: 'course_6',
      title: 'Real Estate Investing',
      description: 'Complete guide to investing in real estate and generating passive income.',
      category: 'Advanced',
      duration: '1h 30min',
      videoUrl: 'https://www.youtube.com/watch?v=g4uwFV9RJdA',
      thumbnail: '🏠',
      instructor: 'Shashank Udupa',
      topics: ['Property Investment', 'REITs', 'Rental Income', 'Market Analysis'],
      isCompleted: false,
    },
    {
      id: 'course_7',
      title: 'Cryptocurrency & Bitcoin',
      description: 'Understand blockchain, Bitcoin, Ethereum and how to invest safely.',
      category: 'Advanced',
      duration: '1h 15min',
      videoUrl: 'https://www.youtube.com/watch?v=1YyAzVmP9xQ',
      thumbnail: '₿',
      instructor: 'Pranjal Kamra',
      topics: ['Cryptocurrency', 'Blockchain', 'Bitcoin', 'Altcoins'],
      isCompleted: false,
    },
    {
      id: 'course_8',
      title: 'Retirement Planning',
      description: 'Plan your retirement with PPF, NPS, EPF and secure your financial future.',
      category: 'Intermediate',
      duration: '50 min',
      videoUrl: 'https://www.youtube.com/watch?v=aU8PXp3h9fs',
      thumbnail: '🎯',
      instructor: 'FinnovationZ',
      topics: ['PPF', 'NPS', 'EPF', 'Pension', 'Retirement Corpus'],
      isCompleted: false,
    },
    {
      id: 'course_9',
      title: 'Technical Analysis',
      description: 'Learn chart patterns, indicators, and technical trading strategies.',
      category: 'Advanced',
      duration: '2h 0min',
      videoUrl: 'https://www.youtube.com/watch?v=NlJJJ9H8N5Y',
      thumbnail: '📉',
      instructor: 'Zerodha Varsity',
      topics: ['Charts', 'Indicators', 'Patterns', 'Trading Strategies'],
      isCompleted: false,
    },
    {
      id: 'course_10',
      title: 'Insurance Planning',
      description: 'Understand life insurance, health insurance and choose the right coverage.',
      category: 'Beginner',
      duration: '40 min',
      videoUrl: 'https://www.youtube.com/watch?v=mGh1i0Y5xv8',
      thumbnail: '🛡️',
      instructor: 'Yadnya Investment Academy',
      topics: ['Term Insurance', 'Health Insurance', 'Coverage', 'Premiums'],
      isCompleted: false,
    },
    {
      id: 'course_11',
      title: 'Financial Freedom Blueprint',
      description: 'Step-by-step guide to achieve financial independence and retire early (FIRE).',
      category: 'Advanced',
      duration: '1h 45min',
      videoUrl: 'https://www.youtube.com/watch?v=8si7cqw9wm0',
      thumbnail: '🔥',
      instructor: 'Warikoo',
      topics: ['FIRE Movement', 'Passive Income', 'Wealth Building', 'Financial Independence'],
      isCompleted: false,
    },
    {
      id: 'course_12',
      title: 'Emergency Fund & Risk Management',
      description: 'Build a strong financial safety net and manage risks effectively.',
      category: 'Beginner',
      duration: '35 min',
      videoUrl: 'https://www.youtube.com/watch?v=T7M9EwOzD3k',
      thumbnail: '🚨',
      instructor: 'Shankar Nath',
      topics: ['Emergency Fund', 'Risk Management', 'Financial Security', 'Contingency Planning'],
      isCompleted: false,
    },
  ];

  const paidCourses: PaidCourse[] = [
    {
      id: 'paid_1',
      title: 'Complete Stock Market Mastery',
      description: 'Master stock trading, technical analysis, and portfolio management from scratch to advanced level.',
      price: 2999,
      instructor: 'CA Rachana Ranade',
      instructorImage: '👩‍🏫',
      thumbnail: '📈',
      duration: '12 hours',
      lessons: 45,
      rating: 4.8,
      students: 15420,
      category: 'Investing',
      isPurchased: false,
    },
    {
      id: 'paid_2',
      title: 'Options Trading Bootcamp',
      description: 'Learn options strategies, risk management, and make consistent profits in derivatives market.',
      price: 3999,
      instructor: 'Vivek Bajaj',
      instructorImage: '👨‍💼',
      thumbnail: '📊',
      duration: '15 hours',
      lessons: 52,
      rating: 4.9,
      students: 8750,
      category: 'Advanced Trading',
      isPurchased: false,
    },
    {
      id: 'paid_3',
      title: 'Real Estate Investment Blueprint',
      description: 'Complete guide to property investment, REITs, legal aspects, and wealth creation through real estate.',
      price: 4499,
      instructor: 'Shashank Udupa',
      instructorImage: '🏠',
      thumbnail: '🏘️',
      duration: '10 hours',
      lessons: 38,
      rating: 4.7,
      students: 5280,
      category: 'Real Estate',
      isPurchased: false,
    },
    {
      id: 'paid_4',
      title: 'Tax Planning & Optimization',
      description: 'Advanced tax saving strategies, deductions, exemptions, and legal ways to minimize tax liability.',
      price: 1999,
      instructor: 'CA Sahil Jain',
      instructorImage: '👨‍💻',
      thumbnail: '💰',
      duration: '8 hours',
      lessons: 30,
      rating: 4.6,
      students: 12100,
      category: 'Tax Planning',
      isPurchased: false,
    },
    {
      id: 'paid_5',
      title: 'Passive Income Masterclass',
      description: 'Build multiple income streams through dividends, rental income, online business, and investments.',
      price: 3499,
      instructor: 'Ankur Warikoo',
      instructorImage: '💼',
      thumbnail: '💵',
      duration: '14 hours',
      lessons: 48,
      rating: 4.9,
      students: 22500,
      category: 'Wealth Building',
      isPurchased: false,
    },
    {
      id: 'paid_6',
      title: 'Cryptocurrency Investment Guide',
      description: 'Everything about Bitcoin, Ethereum, DeFi, NFTs, and safe crypto investing strategies.',
      price: 2499,
      instructor: 'Pranjal Kamra',
      instructorImage: '₿',
      thumbnail: '🪙',
      duration: '9 hours',
      lessons: 35,
      rating: 4.5,
      students: 9840,
      category: 'Cryptocurrency',
      isPurchased: false,
    },
  ];

  const handleToggleComplete = (courseId: string) => {
    const newCompleted = new Set(completedCourses);
    if (completedCourses.has(courseId)) {
      newCompleted.delete(courseId);
    } else {
      newCompleted.add(courseId);
      // Dispatch event for auto-completing tasks
      window.dispatchEvent(new CustomEvent('courseCompleted'));
    }
    setCompletedCourses(newCompleted);
    localStorage.setItem('finwise_completed_courses', JSON.stringify(Array.from(newCompleted)));
  };

  const handlePurchaseCourse = (course: PaidCourse) => {
    setSelectedCourse(course);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    if (selectedCourse) {
      const newPurchased = new Set(purchasedCourses);
      newPurchased.add(selectedCourse.id);
      setPurchasedCourses(newPurchased);
      localStorage.setItem('finwise_purchased_courses', JSON.stringify(Array.from(newPurchased)));
      setShowPayment(false);
      setSelectedCourse(null);
    }
  };

  const categories = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const filteredCourses = selectedCategory === 'All' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

  const completedCount = completedCourses.size;
  const progressPercentage = (completedCount / courses.length) * 100;

  // Calculate level-based discount: 5% every 20 levels, max 25% at level 100
  const calculateDiscount = (level: number) => {
    return Math.min(Math.floor(level / 20) * 5, 25);
  };

  const playerLevel = player?.level || 1;
  const discountPercentage = calculateDiscount(playerLevel);
  const hasDiscount = discountPercentage > 0;

  return (
    <>
      <div className="min-h-screen pb-8 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Back Button & Header */}
        <div className="mb-6 pt-6">
        <Link href="/dashboard" className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200 mb-4">
          <div className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 group-hover:bg-white dark:group-hover:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 shadow-sm transition-all duration-200 group-hover:-translate-x-0.5">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back</span>
        </Link>          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📚 Finance Courses
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Learn from the best financial educators
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg">
              <div className="text-center">
                <div className="text-sm font-medium mb-1">Progress</div>
                <div className="text-3xl font-bold mb-2">{completedCount}/{courses.length}</div>
                <div className="text-xs opacity-90">Free Courses Completed</div>
                <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('free')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'free'
                ? 'text-sky-600 dark:text-sky-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Free Courses
            {activeTab === 'free' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'paid'
                ? 'text-sky-600 dark:text-sky-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Learn & Earn 💰
            {activeTab === 'paid' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400"></div>
            )}
          </button>
        </div>

        {/* Free Courses Tab */}
        {activeTab === 'free' && (
          <div>
            {/* Category Filter */}
            <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                ? 'bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const isCompleted = completedCourses.has(course.id);
          
          return (
            <div
              key={course.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 ${
                isCompleted
                  ? 'border-green-500 dark:border-green-600'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Thumbnail & Category */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl">{course.thumbnail}</div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    course.category === 'Beginner'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : course.category === 'Intermediate'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  }`}>
                    {course.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ⏱️ {course.duration}
                  </span>
                </div>
              </div>

              {/* Title & Instructor */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                by <span className="font-semibold">{course.instructor}</span>
              </p>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {course.description}
              </p>

              {/* Topics */}
              <div className="flex flex-wrap gap-2 mb-4">
                {course.topics.slice(0, 3).map((topic, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded"
                  >
                    {topic}
                  </span>
                ))}
                {course.topics.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    +{course.topics.length - 3} more
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={course.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold hover:from-red-700 hover:to-red-800 transition-all text-center"
                >
                  ▶️ Watch Now
                </a>
                <button
                  onClick={() => handleToggleComplete(course.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isCompleted
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                  title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isCompleted ? '✓' : '○'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Learning Tip */}
      <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-blue-300 dark:border-blue-700">
        <div className="flex items-start gap-4">
          <div className="text-4xl">💡</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Learning Tips
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Start with Beginner courses if you're new to finance</li>
              <li>• Take notes while watching and apply concepts immediately</li>
              <li>• Complete courses in order for better understanding</li>
              <li>• Mark courses as complete to track your progress</li>
            </ul>
          </div>
        </div>
      </div>
          </div>
        )}

        {/* Paid Courses Tab - Learn & Earn */}
        {activeTab === 'paid' && (
          <div>
            <div className="mb-6 p-6 bg-gradient-to-r from-orange-500 to-pink-500 dark:from-sky-400 via-blue-400 to-violet-400 rounded-2xl text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">💰 Learn & Earn Section</h2>
                  <p className="text-sm opacity-90">
                    Invest in premium courses from top educators and unlock advanced financial knowledge
                  </p>
                </div>
                {hasDiscount && (
                  <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border-2 border-white/30">
                    <div className="text-xs opacity-90">Level {playerLevel} Discount</div>
                    <div className="text-3xl font-bold">{discountPercentage}% OFF</div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paidCourses.map((course) => {
                const isPurchased = purchasedCourses.has(course.id);
                const originalPrice = course.price;
                const discountedPrice = hasDiscount 
                  ? Math.round(originalPrice * (1 - discountPercentage / 100))
                  : originalPrice;
                const savings = originalPrice - discountedPrice;
                
                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 border-gray-200 dark:border-gray-700"
                  >
                    {/* Thumbnail & Price */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-5xl">{course.thumbnail}</div>
                      <div className="text-right">
                        {hasDiscount && !isPurchased && (
                          <div className="mb-1">
                            <span className="text-sm text-gray-400 line-through">₹{originalPrice}</span>
                            <span className="ml-2 text-xs px-2 py-0.5 bg-red-500 text-white rounded-full font-semibold">
                              -{discountPercentage}%
                            </span>
                          </div>
                        )}
                        <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                          ₹{discountedPrice}
                        </div>
                        {hasDiscount && !isPurchased && (
                          <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                            Save ₹{savings}
                          </div>
                        )}
                        {isPurchased && (
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full block mt-1">
                            Purchased
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Instructor */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{course.instructorImage}</span>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {course.instructor}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {course.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                        <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">
                          {course.duration}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Lessons:</span>
                        <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">
                          {course.lessons}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Rating:</span>
                        <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">
                          ⭐ {course.rating}/5
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Students:</span>
                        <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">
                          {course.students.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="mb-4">
                      <span className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                        {course.category}
                      </span>
                    </div>

                    {/* Action Button */}
                    {isPurchased ? (
                      <button className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold">
                        ▶️ Start Learning
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchaseCourse(course)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                      >
                        🛒 Purchase Now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Educator Benefits */}
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-blue-300 dark:border-blue-700">
              <div className="flex items-start gap-4">
                <div className="text-4xl">👨‍🏫</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    For Educators
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Share your financial expertise and earn money by creating courses on FinWise.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                    <li>• Upload paid or free learning content</li>
                    <li>• Set your own course prices</li>
                    <li>• Earn 70% revenue share on every sale</li>
                    <li>• Reach thousands of learners</li>
                  </ul>
                  <button className="px-6 py-2 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                    Become an Educator
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Complete Payment
              </h3>
              <button
                onClick={() => setShowPayment(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Course Details */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{selectedCourse.thumbnail}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {selectedCourse.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    by {selectedCourse.instructor}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {hasDiscount && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Original Price</span>
                      <span className="text-gray-400 line-through">₹{selectedCourse.price}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Level {playerLevel} Discount ({discountPercentage}%)</span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        -₹{selectedCourse.price - Math.round(selectedCourse.price * (1 - discountPercentage / 100))}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {hasDiscount ? 'Total Amount' : 'Amount to Pay'}
                  </span>
                  <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                    ₹{hasDiscount ? Math.round(selectedCourse.price * (1 - discountPercentage / 100)) : selectedCourse.price}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handlePaymentSuccess}
                className="w-full p-4 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-sky-500 dark:hover:border-indigo-400 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">G</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Google Pay</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={handlePaymentSuccess}
                className="w-full p-4 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-sky-500 dark:hover:border-indigo-400 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">₹</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">UPI / Cards</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              🔒 Secure payment powered by Stripe • 30-day money-back guarantee
            </p>
          </div>
        </div>
      )}

      <FloatingMentor />
    </>
  );
}
