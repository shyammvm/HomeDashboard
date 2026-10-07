import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Receipt, RefreshCw, CreditCard, ArrowDownLeft, Clock } from 'lucide-react';
import {
  fetchSpendTodaySummary,
  fetchExpenseList,
  formatCurrency,
  formatExpenseTime,
  getCategoryColor,
} from '../services/expenseService';

export default function ExpenseTrackerCard({
  currency = '₹',
  apiUrl = '',
  secret = '',
  refreshTrigger = 0,
}) {
  const [summary, setSummary] = useState(() => {
    try {
      const saved = localStorage.getItem('aether_expense_today_summary');
      return saved ? JSON.parse(saved) : { todayTotal: 0, isLive: false };
    } catch {
      return { todayTotal: 0, isLive: false };
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('aether_expense_list_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'recent'
  const [isLive, setIsLive] = useState(false);

  // Load data from Expense Tracker API
  const loadExpenseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sumData, listData] = await Promise.all([
        fetchSpendTodaySummary(apiUrl, secret),
        fetchExpenseList(apiUrl, secret, 30),
      ]);

      if (sumData) {
        setSummary(sumData);
        if (sumData.isLive) setIsLive(true);
      }

      if (listData && Array.isArray(listData.expenses)) {
        setExpenses(listData.expenses);
        if (listData.isLive) setIsLive(true);
      }
    } catch (err) {
      console.warn('Error loading expense data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, secret]);

  // Initial load and periodic refresh triggered by App.jsx
  useEffect(() => {
    loadExpenseData();
  }, [loadExpenseData, refreshTrigger]);

  // Compute today's date string in local/IST time (YYYY-MM-DD)
  const todayDateStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Filter expenses for today
  const todayExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (exp.expenseDate && exp.expenseDate === todayDateStr) return true;
      if (exp.createdAt) {
        const itemDate = new Date(exp.createdAt).toDateString();
        return itemDate === new Date().toDateString();
      }
      return false;
    });
  }, [expenses, todayDateStr]);

  // If today has no expenses yet, switch to recent view automatically once loaded
  useEffect(() => {
    if (!isLoading && todayExpenses.length === 0 && expenses.length > 0) {
      setActiveTab('recent');
    }
  }, [todayExpenses.length, expenses.length, isLoading]);

  // Today's Debit vs Credit breakdown
  const todayDebitTotal = useMemo(() => {
    return todayExpenses
      .filter(e => (e.expenseType || 'debit').toLowerCase() !== 'credit')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [todayExpenses]);

  const todayCreditTotal = useMemo(() => {
    return todayExpenses
      .filter(e => (e.expenseType || '').toLowerCase() === 'credit')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [todayExpenses]);

  // Total spent today from API summary (or sum of today's expenses as fallback)
  const todaySpentAmount = summary.todayTotal || todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Selected list of expenses to display
  const displayedExpenses = activeTab === 'today' ? todayExpenses : expenses;

  // Formatted date string for today
  const formattedToday = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="dash-card expense-card stark-hud-card" role="region" aria-label="Personal Expense Tracker">
      <div className="stark-card-corner tl" />
      <div className="stark-card-corner tr" />
      <div className="stark-card-corner bl" />
      <div className="stark-card-corner br" />

      {/* Header */}
      <div className="card-section-header">
        <div className="card-title-group">
          <div className="card-title-icon icon-expenses">
            <Receipt size={18} />
          </div>
          <div>
            <h2 className="card-section-title">Treasury & Burn Rate</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className={`card-header-action-btn ${isLoading ? 'spinning' : ''}`}
            onClick={loadExpenseData}
            title="Refresh expense entries"
            aria-label="Refresh expense entries"
          >
            <RefreshCw size={13} />
          </button>
          <span className="card-badge" style={{ color: 'var(--accent-amber)' }}>
            <span
              className="pulse-dot"
              style={{
                backgroundColor: isLive ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                marginRight: 4,
              }}
            />
            {isLive ? 'LIVE SYNC' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Hero Section: Spent Today */}
      <div className="expense-hero-card">
        <div className="expense-hero-top">
          <div className="expense-hero-label">
            <span>SPENT TODAY</span>
            <span className="expense-hero-date">{formattedToday}</span>
          </div>
          <span className="expense-hero-count-badge">
            {todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <div className="expense-hero-amount">
          {formatCurrency(todaySpentAmount, currency)}
        </div>

        {/* Today's Payment Method Split (Debit / UPI vs Credit) */}
        <div className="expense-hero-split-row">
          <div className="expense-split-item">
            <span className="expense-split-tag debit">
              <ArrowDownLeft size={11} /> UPI / Debit
            </span>
            <span className="expense-split-val">
              {formatCurrency(todayDebitTotal, currency)}
            </span>
          </div>

          <div className="expense-split-divider" />

          <div className="expense-split-item">
            <span className="expense-split-tag credit">
              <CreditCard size={11} /> Credit Card
            </span>
            <span className="expense-split-val">
              {formatCurrency(todayCreditTotal, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs: Today's Tape vs All Recent */}
      <div className="expense-tabs-bar">
        <button
          type="button"
          className={`expense-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <span>Today&apos;s Tape</span>
          <span className="expense-tab-badge">{todayExpenses.length}</span>
        </button>
        <button
          type="button"
          className={`expense-tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <span>Recent Feed</span>
          <span className="expense-tab-badge">{expenses.length}</span>
        </button>
      </div>

      {/* Expenses Listed */}
      <div className="expense-items-scroll custom-scroll">
        {displayedExpenses.length === 0 ? (
          <div className="expense-empty-state">
            <Receipt size={24} style={{ opacity: 0.35, marginBottom: 6 }} />
            <div>
              {activeTab === 'today'
                ? 'No expenses logged today yet.'
                : 'No recent expenses recorded.'}
            </div>
            {activeTab === 'today' && expenses.length > 0 && (
              <button
                type="button"
                className="expense-empty-action"
                onClick={() => setActiveTab('recent')}
              >
                View recent expenses ({expenses.length})
              </button>
            )}
          </div>
        ) : (
          displayedExpenses.map(exp => {
            const catColor = getCategoryColor(exp.category);
            const isCredit = (exp.expenseType || '').toLowerCase() === 'credit';
            const formattedTime = formatExpenseTime(exp.createdAt, exp.expenseDate);

            return (
              <div key={exp.id} className="expense-item-row">
                <div className="expense-item-left">
                  <span
                    className="expense-cat-badge"
                    style={{
                      backgroundColor: `${catColor}1a`,
                      color: catColor,
                      borderColor: `${catColor}40`,
                    }}
                  >
                    <span className="expense-cat-dot" style={{ backgroundColor: catColor }} />
                    {exp.category}
                  </span>

                  <div className="expense-details-box">
                    <div className="expense-merchant-title" title={exp.title}>
                      {exp.title}
                    </div>
                    <div className="expense-meta-tags">
                      <span className={`expense-type-pill ${isCredit ? 'credit' : 'debit'}`}>
                        {isCredit ? 'Credit' : 'UPI/Debit'}
                      </span>
                      {formattedTime && (
                        <span className="expense-time-tag">
                          <Clock size={10} />
                          {formattedTime}
                        </span>
                      )}
                      {exp.source && exp.source.includes('sms') && (
                        <span className="expense-source-tag">SMS</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="expense-item-right">
                  <div className="expense-item-amount">
                    {formatCurrency(exp.amount, currency)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
