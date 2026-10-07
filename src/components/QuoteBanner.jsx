import React from 'react';
import { Terminal, Shield } from 'lucide-react';
import { getQuoteForToday } from '../services/quotesService';

export default function QuoteBanner() {
  const quoteItem = getQuoteForToday();

  return (
    <div className="quote-banner stark-quote-banner" role="complementary" aria-label="Stark Tactical Directive">
      <div className="stark-card-corner tl" />
      <div className="stark-card-corner tr" />
      <div className="stark-card-corner bl" />
      <div className="stark-card-corner br" />

      <div className="stark-quote-icon-box">
        <Terminal size={18} className="stark-quote-icon" />
      </div>

      <div className="quote-content stark-quote-content">
        <div className="stark-directive-tag">
          <Shield size={11} color="var(--accent-gold)" />
          <span>J.A.R.V.I.S. TACTICAL DIRECTIVE // ARCHIVE TRANSMISSION</span>
        </div>
        <p className="quote-text stark-quote-text">“{quoteItem.quote}”</p>
        <span className="quote-author stark-quote-author">// {quoteItem.author.toUpperCase()}</span>
      </div>
    </div>
  );
}
