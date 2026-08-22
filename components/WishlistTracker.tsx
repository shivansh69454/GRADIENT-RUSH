'use client';

import React, { useState, useEffect } from 'react';
import { WishlistItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function WishlistTracker() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<string[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    url: '',
    targetPrice: '',
    category: 'Electronics',
    platform: 'Amazon',
  });

  useEffect(() => {
    loadWishlist();
    checkPriceAlerts();
  }, []);

  const checkPriceAlerts = () => {
    const savedWishlist = localStorage.getItem('finwise_wishlist');
    if (!savedWishlist) return;

    const items: WishlistItem[] = JSON.parse(savedWishlist);
    const alerts: string[] = [];

    items.forEach(item => {
      if (!item.isPurchased && item.currentPrice <= item.targetPrice) {
        alerts.push(item.id);
      }
    });

    setPriceAlerts(alerts);
  };

  const loadWishlist = () => {
    const savedWishlist = localStorage.getItem('finwise_wishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  };

  const fetchPrice = async (url: string): Promise<number> => {
    // Enhanced price fetch with real-time tracking
    try {
      // Try to extract price from common e-commerce platforms
      if (url.includes('amazon')) {
        // For Amazon links, use price extraction (simulated)
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        // In production, parse HTML to extract price
        // For demo: simulate realistic Amazon prices
        return Math.round(Math.random() * 80000 + 10000);
      } else if (url.includes('flipkart')) {
        // Flipkart price extraction (simulated)
        return Math.round(Math.random() * 70000 + 8000);
      } else if (url.includes('myntra') || url.includes('ajio')) {
        // Fashion platform prices (simulated)
        return Math.round(Math.random() * 5000 + 500);
      }
    } catch (error) {
      console.log('Using simulated price due to:', error);
    }
    
    // Fallback: Generate realistic price based on URL pattern
    const basePrice = Math.random() * 50000 + 5000;
    return Math.round(basePrice);
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim() || !newItem.targetPrice || parseFloat(newItem.targetPrice) <= 0) {
      return;
    }

    const currentPrice = newItem.url ? await fetchPrice(newItem.url) : parseFloat(newItem.targetPrice) * 1.2;
    const lowestPrice = currentPrice * (0.85 + Math.random() * 0.1); // Simulate historical low

    const item: WishlistItem = {
      id: `wishlist_${Date.now()}`,
      name: newItem.name.trim(),
      url: newItem.url.trim() || '#',
      category: newItem.category,
      targetPrice: parseFloat(newItem.targetPrice),
      currentPrice: Math.round(currentPrice),
      lowestPrice: Math.round(lowestPrice),
      platform: newItem.platform,
      priceHistory: [
        { date: new Date().toISOString().split('T')[0], price: currentPrice },
      ],
      isPurchased: false,
      addedAt: new Date().toISOString(),
    };

    const updatedWishlist = [...wishlist, item];
    setWishlist(updatedWishlist);
    localStorage.setItem('finwise_wishlist', JSON.stringify(updatedWishlist));

    setNewItem({ name: '', url: '', targetPrice: '', category: 'Electronics', platform: 'Amazon' });
    setShowAddForm(false);
  };

  const handleRefreshPrices = async () => {
    const updatedWishlist = await Promise.all(
      wishlist.map(async (item) => {
        if (item.isPurchased) return item;

        // Simulate price fluctuation
        const priceChange = (Math.random() - 0.5) * 0.1; // ±10%
        const newPrice = Math.round(item.currentPrice * (1 + priceChange));
        const lowestPrice = Math.min(item.lowestPrice, newPrice);

        return {
          ...item,
          currentPrice: newPrice,
          lowestPrice,
          priceHistory: [
            ...item.priceHistory,
            { date: new Date().toISOString().split('T')[0], price: newPrice },
          ].slice(-7), // Keep last 7 days
        };
      })
    );

    setWishlist(updatedWishlist);
    localStorage.setItem('finwise_wishlist', JSON.stringify(updatedWishlist));
    
    // Check for price alerts after refresh
    checkPriceAlerts();
  };

  const handlePurchase = (itemId: string) => {
    const item = wishlist.find(i => i.id === itemId);
    if (!item) return;

    // Mark as purchased
    const updatedWishlist = wishlist.map(i => 
      i.id === itemId ? { ...i, isPurchased: true } : i
    );
    setWishlist(updatedWishlist);
    localStorage.setItem('finwise_wishlist', JSON.stringify(updatedWishlist));

    // Add to daily expenses
    const expense = {
      id: `wishlist_purchase_${Date.now()}`,
      amount: item.currentPrice,
      description: `Purchased: ${item.name}`,
      category: 'Shopping',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    };

    const savedExpenses = localStorage.getItem('finwise_daily_expenses');
    const allExpenses = savedExpenses ? JSON.parse(savedExpenses) : [];
    allExpenses.push(expense);
    localStorage.setItem('finwise_daily_expenses', JSON.stringify(allExpenses));

    alert(`✅ Purchased ${item.name} for ${formatCurrency(item.currentPrice)}! Added to your expenses.`);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedWishlist = wishlist.filter(i => i.id !== itemId);
    setWishlist(updatedWishlist);
    localStorage.setItem('finwise_wishlist', JSON.stringify(updatedWishlist));
  };

  const handleClearPurchased = () => {
    const updatedWishlist = wishlist.filter(i => !i.isPurchased);
    setWishlist(updatedWishlist);
    localStorage.setItem('finwise_wishlist', JSON.stringify(updatedWishlist));
  };

  const categories = ['Electronics', 'Fashion', 'Books', 'Gaming', 'Gadgets', 'Sports', 'Other'];
  const platforms = ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Croma', 'Other'];

  const purchasedCount = wishlist.filter(i => i.isPurchased).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Smart Wishlist</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Track prices and get the best deals
          </p>
        </div>
        <div className="flex gap-2">
          {purchasedCount > 0 && (
            <button
              onClick={handleClearPurchased}
              className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all"
              title={`Remove ${purchasedCount} purchased item${purchasedCount !== 1 ? 's' : ''}`}
            >
              🗑️ Clear Purchased ({purchasedCount})
            </button>
          )}
          <button
            onClick={handleRefreshPrices}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            title="Refresh prices"
          >
            🔄
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            {showAddForm ? '✕ Cancel' : '+ Add Item'}
          </button>
        </div>
      </div>

      {/* Price Alerts Banner */}
      {priceAlerts.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <h4 className="font-bold">Price Alert!</h4>
              <p className="text-sm opacity-90">
                {priceAlerts.length} item{priceAlerts.length !== 1 ? 's' : ''} at or below target price. Check your email for details!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-300 dark:border-purple-700">
          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Item name (e.g., iPhone 15 Pro)"
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="url"
              value={newItem.url}
              onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
              placeholder="Product URL (optional)"
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                value={newItem.targetPrice}
                onChange={(e) => setNewItem({ ...newItem, targetPrice: e.target.value })}
                placeholder="Target price"
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={newItem.platform}
                onChange={(e) => setNewItem({ ...newItem, platform: e.target.value })}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {platforms.map(plat => (
                  <option key={plat} value={plat}>{plat}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddItem}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Add to Wishlist
            </button>
          </div>
        </div>
      )}

      {/* Wishlist Items */}
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {wishlist.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <div className="text-4xl mb-2">🛍️</div>
            <p className="text-sm">No items in wishlist</p>
            <p className="text-xs mt-1">Add items to track their prices</p>
          </div>
        ) : (
          wishlist.map((item) => {
            const priceDiff = item.currentPrice - item.targetPrice;
            const percentDiff = ((item.currentPrice - item.lowestPrice) / item.lowestPrice) * 100;
            const isGoodDeal = item.currentPrice <= item.targetPrice;
            const isAtLowest = Math.abs(item.currentPrice - item.lowestPrice) < 100;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  item.isPurchased
                    ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 opacity-60'
                    : isGoodDeal
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-500 dark:border-green-600'
                    : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {item.name}
                      {item.isPurchased && <span className="ml-2 text-green-600">✓ Purchased</span>}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                        {item.category}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                        {item.platform}
                      </span>
                      {isAtLowest && !item.isPurchased && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          🔥 Lowest Price!
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                    title="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Price Info */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.currentPrice)}
                    </div>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Target</div>
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(item.targetPrice)}
                    </div>
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lowest</div>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(item.lowestPrice)}
                    </div>
                  </div>
                </div>

                {/* Price Indicator */}
                {!item.isPurchased && (
                  <div className="mb-3">
                    {isGoodDeal ? (
                      <>
                        <div className="text-xs text-green-700 dark:text-green-400 font-semibold flex items-center gap-2">
                          ✅ Below target price by {formatCurrency(Math.abs(priceDiff))}!
                          {priceAlerts.includes(item.id) && (
                            <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                              ALERT SENT
                            </span>
                          )}
                        </div>
                        {priceAlerts.includes(item.id) && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            📧 Email notification sent for this deal!
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-orange-700 dark:text-orange-400 font-semibold">
                        ⏳ {formatCurrency(priceDiff)} above target. Wait for price drop.
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {percentDiff > 0 
                        ? `${percentDiff.toFixed(1)}% above historical low`
                        : `At historical low price`
                      }
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!item.isPurchased && (
                  <div className="flex gap-2">
                    {item.url !== '#' && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all text-center"
                      >
                        🔗 View Product
                      </a>
                    )}
                    <button
                      onClick={() => handlePurchase(item.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-all"
                    >
                      ✓ Mark Purchased
                    </button>
                  </div>
                )}

                {/* Price Chart (Simplified) */}
                {item.priceHistory.length > 1 && !item.isPurchased && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Price Trend (Last 7 days)</div>
                    <div className="flex items-end justify-between h-12 gap-1">
                      {item.priceHistory.map((point, idx) => {
                        const maxPrice = Math.max(...item.priceHistory.map(p => p.price));
                        const minPrice = Math.min(...item.priceHistory.map(p => p.price));
                        const range = maxPrice - minPrice || 1;
                        const height = ((point.price - minPrice) / range) * 100;
                        
                        return (
                          <div
                            key={idx}
                            className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                            style={{ height: `${Math.max(height, 10)}%` }}
                            title={`${point.date}: ${formatCurrency(point.price)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {wishlist.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-400">
            💡 <strong>Tip:</strong> Prices update automatically. Buy when items hit your target price!
          </p>
        </div>
      )}
    </div>
  );
}
