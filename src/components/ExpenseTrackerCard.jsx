import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', color: '#f59e0b' },
  { id: 'groceries', name: 'Groceries', color: '#10b981' },
  { id: 'bills', name: 'Bills & Utilities', color: '#6366f1' },
  { id: 'shopping', name: 'Shopping', color: '#ec4899' },
  { id: 'transit', name: 'Transport & Fuel', color: '#06b6d4' },
  { id: 'other', name: 'General', color: '#94a3b8' },
];

const DEFAULT_EXPENSES = [
  { id: 'exp-1', title: 'Specialty Espresso & Pastry', amount: 350, category: 'food', timestamp: new Date().toISOString() },
  { id: 'exp-2', title: 'Supermarket Groceries', amount: 1850, category: 'groceries', timestamp: new Date().toISOString() },
  { id: 'exp-3', title: 'High-Speed Fiber Internet Bill', amount: 1199, category: 'bills', timestamp: new Date().toISOString() },
  { id: 'exp-4', title: 'Metro Transit Card Recharge', amount: 500, category: 'transit', timestamp: new Date().toISOString() },
];

export default function ExpenseTrackerCard({ currency = '₹', monthlyBudget = 40000 }) {
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('aether_expenses');
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
    } catch {
      return DEFAULT_EXPENSES;
    }
  });

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem('aether_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Compute Today's Total
  const todayStr = new Date().toDateString();
  const todayTotal = expenses
    .filter(e => new Date(e.timestamp).toDateString() === todayStr)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Compute Current Month Total
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTotal = expenses
    .filter(e => {
      const d = new Date(e.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Budget Percentage
  const budgetRatio = Math.min(Math.round((monthTotal / monthlyBudget) * 100), 100);
  let budgetStatus = 'safe';
  if (budgetRatio >= 90) budgetStatus = 'danger';
  else if (budgetRatio >= 75) budgetStatus = 'warning';

  // Category breakdown
  const categoryTotals = CATEGORIES.map(cat => {
    const total = expenses
      .filter(e => e.category === cat.id)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return { ...cat, total };
  }).filter(c => c.total > 0);

  const addExpense = (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || isNaN(amount)) return;
    const item = {
      id: Date.now().toString(),
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      timestamp: new Date().toISOString(),
    };
    setExpenses(prev => [item, ...prev]);
    setTitle('');
    setAmount('');
    setIsAdding(false);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="dash-card expense-card" role="region" aria-label="Personal Expense Tracker">
      <div className="card-section-header">
        <div className="card-title-group">
          <div className="card-title-icon icon-expenses">
            <Wallet size={18} />
          </div>
          <div>
            <h2 className="card-section-title">Personal Expense Tracker</h2>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{
            background: isAdding ? 'rgba(255,255,255,0.1)' : 'rgba(251, 191, 36, 0.15)',
            color: isAdding ? 'var(--text-muted)' : 'var(--accent-amber)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 6,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Plus size={13} />
          {isAdding ? 'Close' : 'Quick Add'}
        </button>
      </div>

      {/* Summary KPI Tiles */}
      <div className="expense-summary-box">
        <div className="expense-stat-tile">
          <div className="expense-stat-label">Spent Today</div>
          <div className="expense-stat-val highlight">
            {currency}{todayTotal.toLocaleString()}
          </div>
        </div>
        <div className="expense-stat-tile">
          <div className="expense-stat-label">This Month</div>
          <div className="expense-stat-val">
            {currency}{monthTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Monthly Budget Progress */}
      <div className="budget-bar-wrapper">
        <div className="budget-bar-labels">
          <span>Monthly Target: {currency}{monthlyBudget.toLocaleString()}</span>
          <span>{budgetRatio}% Used</span>
        </div>
        <div className="budget-track">
          <div className={`budget-fill ${budgetStatus}`} style={{ width: `${budgetRatio}%` }} />
        </div>
      </div>

      {/* Inline Quick Add Form */}
      {isAdding && (
        <form onSubmit={addExpense} style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Description (e.g. Lunch with team)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              style={{ flex: 1.5 }}
              autoFocus
              required
            />
            <input
              type="number"
              placeholder={`Amount (${currency})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="form-btn">
              Record Spend
            </button>
          </div>
        </form>
      )}

      {/* Category breakdown bar indicators */}
      {categoryTotals.length > 0 && (
        <div className="expense-category-breakdown">
          {categoryTotals.slice(0, 3).map(c => (
            <div key={c.id} className="cat-row">
              <div className="cat-name-group">
                <span className="cat-dot" style={{ backgroundColor: c.color }} />
                <span style={{ color: 'var(--text-muted)' }}>{c.name}</span>
              </div>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {currency}{c.total.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Spend History */}
      <div className="expense-list custom-scroll">
        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '15px 0', color: 'var(--text-dim)', fontSize: 12 }}>
            No expenses recorded yet.
          </div>
        ) : (
          expenses.slice(0, 5).map(exp => {
            const catObj = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[5];
            return (
              <div key={exp.id} className="expense-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="cat-dot" style={{ backgroundColor: catObj.color }} />
                  <div>
                    <div className="expense-title">{exp.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{catObj.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="expense-amount">{currency}{Number(exp.amount).toLocaleString()}</span>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
                    title="Remove item"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
