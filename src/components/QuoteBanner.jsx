import React from 'react';
import { Quote } from 'lucide-react';
import { getQuoteForToday } from '../services/quotesService';

export default function QuoteBanner() {
  const quoteItem = getQuoteForToday();

  return (
    <div className="quote-banner" role="complementary" aria-label="Daily thought">
      <Quote size={20} className="quote-icon" />
      <div className="quote-content">
        <p className="quote-text">“{quoteItem.quote}”</p>
        <span className="quote-author">— {quoteItem.author}</span>
      </div>
    </div>
  );
}
