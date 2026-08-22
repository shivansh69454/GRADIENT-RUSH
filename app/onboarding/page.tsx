'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Player } from '@/types';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    monthly_allowance: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Please enter your name';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
    }

    if (step === 2) {
      const age = parseInt(formData.age);
      if (!formData.age) {
        newErrors.age = 'Please enter your age';
      } else if (isNaN(age) || age < 13 || age > 100) {
        newErrors.age = 'Age must be between 13 and 100';
      }
    }

    if (step === 3) {
      const allowance = parseInt(formData.monthly_allowance);
      if (!formData.monthly_allowance) {
        newErrors.monthly_allowance = 'Please enter your monthly allowance';
      } else if (isNaN(allowance) || allowance < 1000) {
        newErrors.monthly_allowance = 'Monthly allowance must be at least ₹1,000';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleSubmit = () => {
    const playerData: Player = {
      id: `player_${Date.now()}`,
      name: formData.name,
      age: parseInt(formData.age),
      monthly_allowance: parseInt(formData.monthly_allowance),
      level: 1,
      xp_points: 0,
      total_xp_earned: 0,
      theme_preference: 'light',
      joined_date: new Date().toISOString().split('T')[0],
      isOnboarded: true,
    };

    // Store in localStorage
    localStorage.setItem('finwise_player', JSON.stringify(playerData));
    
    // Redirect to dashboard
    router.push('/dashboard');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Welcome Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mb-4">
              <span className="text-4xl text-white font-bold">₹</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Welcome to FinWise
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your journey to financial mastery begins here!
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                  i <= step 
                    ? 'bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  {i < step ? '✓' : i}
                </div>
                {i < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded ${
                    i < step ? 'bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">👋</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    What's your name?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Let's personalize your experience
                  </p>
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                    placeholder="Enter your name"
                    className={`w-full px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.name ? 'ring-2 ring-red-500' : 'focus:ring-sky-500'
                    }`}
                    autoFocus
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎂</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    How old are you?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    We'll customize tasks based on your age
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                    placeholder="Enter your age"
                    className={`w-full px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-lg focus:outline-none focus:ring-2 transition-all ${
                      errors.age ? 'ring-2 ring-red-500' : 'focus:ring-sky-500'
                    }`}
                    autoFocus
                  />
                  {errors.age && (
                    <p className="mt-2 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">💰</div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    What's your monthly allowance?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    This helps us create personalized financial goals
                  </p>
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={formData.monthly_allowance}
                      onChange={(e) => handleInputChange('monthly_allowance', e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                      placeholder="Enter amount"
                      className={`w-full pl-12 pr-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.monthly_allowance ? 'ring-2 ring-red-500' : 'focus:ring-sky-500'
                      }`}
                      autoFocus
                    />
                  </div>
                  {errors.monthly_allowance && (
                    <p className="mt-2 text-sm text-red-600">{errors.monthly_allowance}</p>
                  )}
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    💡 Tip: Include all sources of income (salary, pocket money, etc.)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30"
            >
              {step === 3 ? 'Start My Journey 🚀' : 'Continue'}
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-white text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl mb-2">🎮</div>
            <p className="text-sm font-semibold">100 Levels</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl mb-2">🤖</div>
            <p className="text-sm font-semibold">AI Mentor</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-sm font-semibold">Track Progress</p>
          </div>
        </div>
      </div>
    </div>
  );
}
