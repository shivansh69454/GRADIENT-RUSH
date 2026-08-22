'use client';

import React, { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { getQuoteOfTheDay } from '@/lib/mockData';
import type { DailyQuote } from '@/types';

export const QuotePanel: React.FC = () => {
  const [quote, setQuote] = useState<DailyQuote | null>(null);

  // Resolved on the client so the day-of-year rotation matches the user's timezone.
  useEffect(() => setQuote(getQuoteOfTheDay()), []);

  if (!quote) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3">
      <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
      <p className="text-xs leading-relaxed text-muted">
        {quote.text}
        <span className="ml-1.5 whitespace-nowrap font-medium text-faint">— {quote.author}</span>
      </p>
    </div>
  );
};

export default QuotePanel;
