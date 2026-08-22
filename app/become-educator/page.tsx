'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface EducatorForm {
  name: string;
  email: string;
  phone: string;
  expertise: string;
  description: string;
}

export default function BecomeEducatorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<EducatorForm>({
    name: '',
    email: '',
    phone: '',
    expertise: '',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<EducatorForm>>({});
  const [success, setSuccess] = useState(false);

  const expertiseOptions = [
    'Stock Market Investing',
    'Mutual Funds',
    'Personal Finance',
    'Cryptocurrency',
    'Real Estate',
    'Tax Planning',
    'Retirement Planning',
    'Insurance',
    'Trading & Technical Analysis',
    'Other',
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<EducatorForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.expertise) {
      newErrors.expertise = 'Please select your area of expertise';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Save to localStorage
    const submissions = JSON.parse(localStorage.getItem('finwise_educator_submissions') || '[]');
    submissions.push({
      ...formData,
      submittedAt: new Date().toISOString(),
      id: `edu-${Date.now()}`,
    });
    localStorage.setItem('finwise_educator_submissions', JSON.stringify(submissions));

    setSuccess(true);
  };

  const handleChange = (field: keyof EducatorForm, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pb-8 px-4 md:px-6 max-w-4xl mx-auto flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center max-w-2xl">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Application Submitted Successfully!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Thank you for your interest in becoming an educator on FinWise! Our team will review your application and get back to you within 3-5 business days.
          </p>
          <div className="bg-gradient-to-r from-sky-100 to-lavender-100 dark:from-indigo-900/20 dark:to-purple-900/20 border border-sky-300 dark:border-sky-700 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-sky-900 dark:text-sky-300 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-indigo-800 dark:text-sky-400 space-y-2 text-left">
              <li>✓ We'll verify your credentials and expertise</li>
              <li>✓ Our team will schedule an interview call</li>
              <li>✓ You'll get access to our educator platform</li>
              <li>✓ Start creating courses and earning!</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  expertise: '',
                  description: '',
                });
              }}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          🎓 Become an Educator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share your financial expertise and help others learn
        </p>
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="text-3xl mb-3">💰</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Earn Income</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get paid for every course sale and student enrollment
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Build Audience</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Reach thousands of learners eager to improve their finances
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Grow Brand</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Establish yourself as a financial expert and thought leader
          </p>
        </div>
      </div>

      {/* Application Form */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Application Form
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your full name"
              className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.name
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-indigo-400'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-indigo-400'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="10-digit phone number"
              className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.phone
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-indigo-400'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Area of Expertise <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.expertise}
              onChange={(e) => handleChange('expertise', e.target.value)}
              className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.expertise
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-indigo-400'
              }`}
            >
              <option value="">Select your expertise</option>
              {expertiseOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.expertise && (
              <p className="mt-1 text-sm text-red-500">{errors.expertise}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tell us about yourself <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Share your experience, qualifications, and why you want to be an educator on FinWise (minimum 50 characters)"
              rows={6}
              className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:outline-none transition-colors resize-none ${
                errors.description
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-indigo-400'
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.description ? (
                <p className="text-sm text-red-500">{errors.description}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.description.length} / 50 minimum characters
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all text-lg"
          >
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
}
