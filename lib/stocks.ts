import type { Stock } from '@/types';

/**
 * Learn-mode watchlist.
 *
 * Prices are fixed reference points with the date they were taken, not a
 * `Math.random()` ticker. A student should never be able to mistake this for a
 * live market feed — the value here is the lesson attached to each company.
 */
export const REFERENCE_DATE = 'Aug 2025';

export const STOCKS: Stock[] = [
  {
    id: 'reliance',
    symbol: 'RELIANCE',
    name: 'Reliance Industries',
    sector: 'Conglomerate',
    referencePrice: 1402,
    yearReturnPct: 11.4,
    concept: 'Market capitalisation',
    conceptExplainer:
      'Market cap = share price × number of shares. It tells you what the whole company is worth, which is why a ₹1,400 share is not "expensive" on its own.',
    lesson:
      'India\'s largest company by market cap. It shows how a business can reinvent itself — textiles, then oil, then telecom with Jio.',
  },
  {
    id: 'tcs',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    sector: 'IT Services',
    referencePrice: 3068,
    yearReturnPct: -2.1,
    concept: 'Dividend yield',
    conceptExplainer:
      'Dividend yield is the annual dividend divided by the share price. A steady 3% yield means the company pays you to hold it, separate from price movement.',
    lesson:
      'A cash-generating IT giant that pays consistent dividends. Useful for understanding why boring, profitable businesses matter.',
  },
  {
    id: 'hdfcbank',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank',
    sector: 'Banking',
    referencePrice: 1642,
    yearReturnPct: 7.8,
    concept: 'P/E ratio',
    conceptExplainer:
      'Price-to-earnings compares the share price with profit per share. A P/E of 18 means investors pay ₹18 for every ₹1 of annual profit.',
    lesson:
      'Banks make money on the spread between deposit and lending rates. Watching one teaches you how interest rates move the whole economy.',
  },
  {
    id: 'zomato',
    symbol: 'ZOMATO',
    name: 'Eternal (Zomato)',
    sector: 'Consumer Tech',
    referencePrice: 268,
    yearReturnPct: 42.6,
    concept: 'Volatility',
    conceptExplainer:
      'Volatility is how violently a price swings. High-growth companies swing hardest, which is why you never invest money you need next month.',
    lesson:
      'The company you order dinner from. A sharp reminder that your spending and your investing are two sides of the same rupee.',
  },
  {
    id: 'itc',
    symbol: 'ITC',
    name: 'ITC Limited',
    sector: 'FMCG',
    referencePrice: 412,
    yearReturnPct: 4.2,
    concept: 'Defensive stock',
    conceptExplainer:
      'Defensive companies sell things people buy regardless of the economy — soap, biscuits, cigarettes. Their prices fall less in a crash.',
    lesson:
      'FMCG businesses grow slowly and steadily. They are the portfolio equivalent of a fixed deposit with upside.',
  },
  {
    id: 'infy',
    symbol: 'INFY',
    name: 'Infosys',
    sector: 'IT Services',
    referencePrice: 1547,
    yearReturnPct: -5.4,
    concept: 'Rupee-dollar exposure',
    conceptExplainer:
      'Infosys earns in dollars and spends in rupees. A weaker rupee quietly increases its profit without it selling anything more.',
    lesson:
      'Shows how currency movements, not just company performance, can drive returns for exporters.',
  },
  {
    id: 'niftybees',
    symbol: 'NIFTYBEES',
    name: 'Nippon Nifty 50 ETF',
    sector: 'Index Fund',
    referencePrice: 279,
    yearReturnPct: 9.6,
    concept: 'Diversification',
    conceptExplainer:
      'One unit of this ETF holds all 50 Nifty companies. If one collapses, the other 49 cushion you — this is diversification in a single click.',
    lesson:
      'The single most sensible first investment for a beginner. You own the whole Indian market instead of guessing winners.',
  },
  {
    id: 'tatamotors',
    symbol: 'TATAMOTORS',
    name: 'Tata Motors',
    sector: 'Automobile',
    referencePrice: 682,
    yearReturnPct: -14.2,
    concept: 'Cyclical business',
    conceptExplainer:
      'Cyclicals boom and bust with the economy. People delay buying cars in a downturn, so profits swing far more than sales do.',
    lesson:
      'A good case study in why a falling price is not automatically a bargain. Context beats discount.',
  },
];

export const getStock = (symbol: string): Stock | undefined =>
  STOCKS.find((s) => s.symbol === symbol);

/**
 * "Your Zomato money would be worth X" — reframes a real expense category as a
 * forgone investment using the reference one-year return.
 */
export const opportunityCost = (
  amount: number,
  stock: Stock
): { value: number; gain: number; isGain: boolean } => {
  const value = amount * (1 + stock.yearReturnPct / 100);
  const gain = value - amount;
  return { value, gain, isGain: gain >= 0 };
};
