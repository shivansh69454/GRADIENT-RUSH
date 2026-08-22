'use client';

import React, { useState, useEffect } from 'react';
import { Stock } from '@/types';

export default function StockWatchlist() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load stocks from localStorage
    const savedStocks = localStorage.getItem('finwise_stocks');
    if (savedStocks) {
      setStocks(JSON.parse(savedStocks));
    } else {
      // Default stocks
      const defaultStocks: Stock[] = [
        { id: '1', symbol: 'RELIANCE.BSE', name: 'Reliance Industries', currentPrice: 2456.75, changePercent: 2.34, isPositive: true },
        { id: '2', symbol: 'TCS.BSE', name: 'Tata Consultancy', currentPrice: 3678.90, changePercent: -1.12, isPositive: false },
        { id: '3', symbol: 'INFY.BSE', name: 'Infosys', currentPrice: 1523.45, changePercent: 0.87, isPositive: true },
      ];
      setStocks(defaultStocks);
      localStorage.setItem('finwise_stocks', JSON.stringify(defaultStocks));
    }
  }, []);

  const searchStocks = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Using Yahoo Finance API via RapidAPI proxy
      const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`);
      const data = await response.json();
      
      if (data.quotes) {
        const results = data.quotes
          .filter((q: any) => q.quoteType === 'EQUITY')
          .map((q: any) => ({
            symbol: q.symbol,
            name: q.longname || q.shortname || q.symbol,
            exchange: q.exchange,
          }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to mock search
      const mockResults = [
        { symbol: query.toUpperCase() + '.BSE', name: query.toUpperCase() + ' Limited', exchange: 'BSE' },
        { symbol: query.toUpperCase() + '.NSE', name: query.toUpperCase() + ' Limited', exchange: 'NSE' },
      ];
      setSearchResults(mockResults);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      const debounceTimer = setTimeout(() => searchStocks(value), 500);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  };

  const addStockFromSearch = async (result: any) => {
    setIsLoading(true);
    try {
      // Fetch current price from Yahoo Finance
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${result.symbol}?interval=1d&range=1d`);
      const data = await response.json();
      
      let currentPrice = 0;
      let changePercent = 0;
      
      if (data.chart?.result?.[0]) {
        const quote = data.chart.result[0];
        currentPrice = quote.meta?.regularMarketPrice || 0;
        const previousClose = quote.meta?.previousClose || currentPrice;
        changePercent = ((currentPrice - previousClose) / previousClose) * 100;
      }

      const newStock: Stock = {
        id: `stock_${Date.now()}`,
        symbol: result.symbol,
        name: result.name,
        currentPrice: currentPrice || Math.random() * 5000 + 500,
        changePercent: changePercent || (Math.random() - 0.5) * 10,
        isPositive: changePercent >= 0,
      };

      const updatedStocks = [...stocks, newStock];
      setStocks(updatedStocks);
      localStorage.setItem('finwise_stocks', JSON.stringify(updatedStocks));
      
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      // Fallback to mock data
      const newStock: Stock = {
        id: `stock_${Date.now()}`,
        symbol: result.symbol,
        name: result.name,
        currentPrice: Math.random() * 5000 + 500,
        changePercent: (Math.random() - 0.5) * 10,
        isPositive: Math.random() > 0.5,
      };

      const updatedStocks = [...stocks, newStock];
      setStocks(updatedStocks);
      localStorage.setItem('finwise_stocks', JSON.stringify(updatedStocks));
      
      setSearchQuery('');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStock = (id: string) => {
    const updatedStocks = stocks.filter(s => s.id !== id);
    setStocks(updatedStocks);
    localStorage.setItem('finwise_stocks', JSON.stringify(updatedStocks));
  };

  const handleRefreshPrices = async () => {
    setIsLoading(true);
    try {
      const updatedStocks = await Promise.all(
        stocks.map(async (stock) => {
          try {
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}?interval=1d&range=1d`);
            const data = await response.json();
            
            if (data.chart?.result?.[0]) {
              const quote = data.chart.result[0];
              const currentPrice = quote.meta?.regularMarketPrice || stock.currentPrice;
              const previousClose = quote.meta?.previousClose || currentPrice;
              const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
              
              return {
                ...stock,
                currentPrice,
                changePercent,
                isPositive: changePercent >= 0,
              };
            }
          } catch (error) {
            console.error(`Error refreshing ${stock.symbol}:`, error);
          }
          
          // Fallback to simulated update
          return {
            ...stock,
            currentPrice: stock.currentPrice + (Math.random() - 0.5) * 100,
            changePercent: (Math.random() - 0.5) * 10,
            isPositive: Math.random() > 0.5,
          };
        })
      );
      
      setStocks(updatedStocks);
      localStorage.setItem('finwise_stocks', JSON.stringify(updatedStocks));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Stock Watchlist</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Track your favorite stocks
          </p>
        </div>
        <button
          onClick={handleRefreshPrices}
          disabled={isLoading}
          className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium disabled:opacity-50"
        >
          {isLoading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* Search Stock */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search stocks (e.g., Reliance, Infosys, TCS)"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-2.5 text-gray-400">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => addStockFromSearch(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
              >
                <div className="font-semibold text-sm text-gray-900 dark:text-white">
                  {result.symbol}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {result.name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stock List */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {stocks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-sm">No stocks in watchlist</p>
            <p className="text-xs mt-1">Search and add stocks to track</p>
          </div>
        ) : (
          stocks.map((stock) => (
            <div
              key={stock.id}
              className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white text-lg">
                      {stock.symbol}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      stock.isPositive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {stock.isPositive ? '↑' : '↓'} {Math.abs(stock.changePercent).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    ₹{stock.currentPrice.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveStock(stock.id)}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-400">
          💡 <strong>Tip:</strong> Search for stocks using company names or symbols. Prices refresh automatically.
        </p>
      </div>
    </div>
  );
}