'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  image: string;
  blinkit: { price: number; available: boolean; delivery: string };
  zepto: { price: number; available: boolean; delivery: string };
  flipkart: { price: number; available: boolean; delivery: string };
}

export default function ShoppingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock product database
  const mockProducts: Record<string, Product> = {
    'milk': {
      id: '1',
      name: 'Amul Gold Milk (1L)',
      image: '🥛',
      blinkit: { price: 68, available: true, delivery: '8 mins' },
      zepto: { price: 66, available: true, delivery: '10 mins' },
      flipkart: { price: 72, available: true, delivery: '2 days' },
    },
    'bread': {
      id: '2',
      name: 'Britannia Bread (400g)',
      image: '🍞',
      blinkit: { price: 45, available: true, delivery: '8 mins' },
      zepto: { price: 42, available: true, delivery: '10 mins' },
      flipkart: { price: 48, available: true, delivery: '2 days' },
    },
    'chips': {
      id: '3',
      name: 'Lays Classic Chips (52g)',
      image: '🍟',
      blinkit: { price: 20, available: true, delivery: '8 mins' },
      zepto: { price: 20, available: true, delivery: '10 mins' },
      flipkart: { price: 22, available: true, delivery: '2 days' },
    },
    'rice': {
      id: '4',
      name: 'India Gate Basmati Rice (5kg)',
      image: '🍚',
      blinkit: { price: 485, available: true, delivery: '8 mins' },
      zepto: { price: 478, available: true, delivery: '10 mins' },
      flipkart: { price: 495, available: true, delivery: '1 day' },
    },
    'soap': {
      id: '5',
      name: 'Dove Soap (125g)',
      image: '🧼',
      blinkit: { price: 62, available: true, delivery: '8 mins' },
      zepto: { price: 59, available: true, delivery: '10 mins' },
      flipkart: { price: 65, available: true, delivery: '2 days' },
    },
    'oil': {
      id: '6',
      name: 'Fortune Sunflower Oil (1L)',
      image: '🛢️',
      blinkit: { price: 195, available: true, delivery: '8 mins' },
      zepto: { price: 192, available: true, delivery: '10 mins' },
      flipkart: { price: 198, available: true, delivery: '1 day' },
    },
    'tea': {
      id: '7',
      name: 'Tata Tea Gold (1kg)',
      image: '☕',
      blinkit: { price: 485, available: true, delivery: '8 mins' },
      zepto: { price: 480, available: true, delivery: '10 mins' },
      flipkart: { price: 492, available: true, delivery: '2 days' },
    },
    'coffee': {
      id: '8',
      name: 'Nescafe Classic Coffee (50g)',
      image: '☕',
      blinkit: { price: 175, available: true, delivery: '8 mins' },
      zepto: { price: 172, available: true, delivery: '10 mins' },
      flipkart: { price: 180, available: true, delivery: '2 days' },
    },
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome.');
      return;
    }

    // @ts-ignore - webkitSpeechRecognition is not in the types
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      const micButton = document.querySelector('[aria-label="Voice input"]');
      if (micButton) {
        micButton.classList.add('ring-2', 'ring-red-500');
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setTimeout(handleSearch, 300); // Auto search after voice input
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      alert('Error with speech recognition. Please try again.');
    };

    recognition.onend = () => {
      const micButton = document.querySelector('[aria-label="Voice input"]');
      if (micButton) {
        micButton.classList.remove('ring-2', 'ring-red-500');
      }
    };

    recognition.start();
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const results: Product[] = [];

      Object.entries(mockProducts).forEach(([key, product]) => {
        if (product.name.toLowerCase().includes(query) || key.includes(query)) {
          results.push(product);
        }
      });

      setSearchResults(results);
      setLoading(false);
    }, 800);
  };

  const getBestPrice = (product: Product) => {
    const prices = [
      { platform: 'Blinkit', ...product.blinkit },
      { platform: 'Zepto', ...product.zepto },
      { platform: 'Flipkart', ...product.flipkart },
    ].filter(p => p.available);

    return prices.reduce((min, p) => p.price < min.price ? p : min);
  };

  const popularSearches = ['milk', 'bread', 'rice', 'oil', 'tea', 'soap'];

  return (
    <div className="min-h-screen pb-8 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="mb-6 pt-6">
        <Link href="/dashboard" className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200 mb-4">
          <div className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 group-hover:bg-white dark:group-hover:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 shadow-sm transition-all duration-200 group-hover:-translate-x-0.5">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back</span>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🛒 Smart Shopping
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compare prices across Blinkit, Zepto, and Flipkart
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for products (e.g., milk, bread, rice)..."
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-sky-500 dark:focus:border-indigo-400 focus:outline-none transition-colors"
          />
          <button
            onClick={handleVoiceInput}
            type="button"
            className="p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-sky-500 dark:hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all group"
            aria-label="Voice input"
          >
            <div className="w-6 h-6 transition-transform group-hover:scale-110">🎤</div>
          </button>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Popular Searches */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 dark:text-gray-400">Popular:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => {
                setSearchQuery(term);
                setTimeout(handleSearch, 100);
              }}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
              Save money by comparing prices!
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              We show you the best deals across multiple platforms. Start searching above.
            </p>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Search Results ({searchResults.length})
          </h2>

          {searchResults.map((product) => {
            const bestDeal = getBestPrice(product);
            
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6"
              >
                {/* Product Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl">{product.image}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {product.name}
                    </h3>
                    <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-lg text-sm font-semibold">
                      <span>🏆</span>
                      <span>Best Price: ₹{bestDeal.price} on {bestDeal.platform}</span>
                    </div>
                  </div>
                </div>

                {/* Price Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Blinkit */}
                  <div className={`border-2 rounded-xl p-4 transition-all ${
                    bestDeal.platform === 'Blinkit'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900 dark:text-white">Blinkit</h4>
                      {bestDeal.platform === 'Blinkit' && (
                        <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                      )}
                    </div>
                    {product.blinkit.available ? (
                      <>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          ₹{product.blinkit.price}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          🚀 Delivery: {product.blinkit.delivery}
                        </p>
                      </>
                    ) : (
                      <p className="text-red-600 dark:text-red-400">Not Available</p>
                    )}
                  </div>

                  {/* Zepto */}
                  <div className={`border-2 rounded-xl p-4 transition-all ${
                    bestDeal.platform === 'Zepto'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900 dark:text-white">Zepto</h4>
                      {bestDeal.platform === 'Zepto' && (
                        <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                      )}
                    </div>
                    {product.zepto.available ? (
                      <>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          ₹{product.zepto.price}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          🚀 Delivery: {product.zepto.delivery}
                        </p>
                      </>
                    ) : (
                      <p className="text-red-600 dark:text-red-400">Not Available</p>
                    )}
                  </div>

                  {/* Flipkart */}
                  <div className={`border-2 rounded-xl p-4 transition-all ${
                    bestDeal.platform === 'Flipkart'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900 dark:text-white">Flipkart</h4>
                      {bestDeal.platform === 'Flipkart' && (
                        <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                      )}
                    </div>
                    {product.flipkart.available ? (
                      <>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          ₹{product.flipkart.price}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          📦 Delivery: {product.flipkart.delivery}
                        </p>
                      </>
                    ) : (
                      <p className="text-red-600 dark:text-red-400">Not Available</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {searchResults.length === 0 && !loading && searchQuery && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No products found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try searching for: {popularSearches.join(', ')}
          </p>
        </div>
      )}

      {!searchQuery && searchResults.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛍️</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Start by searching for a product
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a product name to compare prices across platforms
          </p>
        </div>
      )}
    </div>
  );
}
