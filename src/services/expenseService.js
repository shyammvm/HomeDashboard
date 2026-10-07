import { DASHBOARD_CONFIG } from '../config';

const DEFAULT_API_URL = DASHBOARD_CONFIG.expenseTrackerApiUrl || 'https://smartexpensetracker-vtkb.onrender.com';
const LOCAL_API_URL = 'http://127.0.0.1:8000';
const DEFAULT_SECRET = DASHBOARD_CONFIG.expenseTrackerSecret || '2546698';

// Category color palette
export const CATEGORY_COLORS = {
  'food': '#f59e0b',
  'grocery': '#10b981',
  'shopping': '#ec4899',
  'bills': '#6366f1',
  'petrol': '#06b6d4',
  'travel': '#0ea5e9',
  'vehicle': '#14b8a6',
  'entertainment': '#a855f7',
  'subscriptions': '#8b5cf6',
  'credit card': '#f43f5e',
  'emi': '#ef4444',
  'donations': '#84cc16',
  'investment': '#22c55e',
  'rent/cook': '#eab308',
  'health': '#06b6d4',
  'others': '#94a3b8',
  'general': '#94a3b8',
};

export function getCategoryColor(category = '') {
  const key = String(category).toLowerCase().trim();
  return CATEGORY_COLORS[key] || '#94a3b8';
}

/**
 * Formats time for an expense:
 * If today, returns "5:24 PM"
 * If yesterday, returns "Yesterday 9:59 PM"
 * Else returns "Oct 6, 2:15 PM"
 */
export function formatExpenseTime(createdAt, expenseDate) {
  try {
    const dateObj = createdAt ? new Date(createdAt) : (expenseDate ? new Date(expenseDate) : null);
    if (!dateObj || isNaN(dateObj.getTime())) {
      return expenseDate || '';
    }

    const now = new Date();
    const isToday = dateObj.toDateString() === now.toDateString();
    
    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = dateObj.toDateString() === yesterday.toDateString();

    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return timeStr;
    }
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }
    const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return expenseDate || '';
  }
}

/**
 * Format currency amount with commas and symbol
 */
export function formatCurrency(amount = 0, currency = '₹') {
  const num = Number(amount) || 0;
  return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Fetch from proxy or direct URL with timeout and fallback
 */
async function fetchWithFallback(endpoints, options = {}, timeoutMs = 8000) {
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Continue to next endpoint in fallback chain
    }
  }
  throw new Error('All expense endpoints failed');
}

/**
 * Fetch today's summary from expense tracker
 * NOTE: Strictly extracts today's spend data and ignores any salary/monthly data!
 */
export async function fetchSpendTodaySummary(customApiUrl, customSecret) {
  const secret = customSecret || DEFAULT_SECRET;
  const baseUrl = (customApiUrl || DEFAULT_API_URL).replace(/\/+$/, '');

  const endpoints = [
    // 1. Vite / Express proxy (avoids any browser CORS / SSL issues)
    '/api/expenses/summary',
    // 2. Direct local backend if on localhost
    `${LOCAL_API_URL}/summary/entry-page`,
    // 3. Direct Render backend
    `${baseUrl}/summary/entry-page`,
  ];

  try {
    const data = await fetchWithFallback(endpoints, {
      headers: {
        'Accept': 'application/json',
        'x-endpoint-secret': secret,
      },
    });

    const summary = {
      todayTotal: Number(data.today_total || 0),
      todayVariableTotal: Number(data.today_variable_total || 0),
      isLive: true,
      timestamp: Date.now(),
    };

    // Cache locally for instant boot display
    localStorage.setItem('aether_expense_today_summary', JSON.stringify(summary));
    return summary;
  } catch (err) {
    console.warn('Expense summary fetch failed, using cache:', err.message);
    const cached = localStorage.getItem('aether_expense_today_summary');
    if (cached) {
      try {
        return { ...JSON.parse(cached), isLive: false };
      } catch {
        // ignore
      }
    }
    return {
      todayTotal: 0,
      todayVariableTotal: 0,
      isLive: false,
      timestamp: Date.now(),
    };
  }
}

/**
 * Fetch recent expenses list from expense tracker
 */
export async function fetchExpenseList(customApiUrl, customSecret, limit = 30) {
  const secret = customSecret || DEFAULT_SECRET;
  const baseUrl = (customApiUrl || DEFAULT_API_URL).replace(/\/+$/, '');

  const endpoints = [
    // 1. Vite / Express proxy
    `/api/expenses/recent?limit=${limit}`,
    // 2. Direct local backend
    `${LOCAL_API_URL}/expenses/recent?limit=${limit}`,
    // 3. Direct Render backend
    `${baseUrl}/expenses/recent?limit=${limit}`,
  ];

  try {
    const data = await fetchWithFallback(endpoints, {
      headers: {
        'Accept': 'application/json',
        'x-endpoint-secret': secret,
      },
    });

    const rawList = Array.isArray(data.expenses) ? data.expenses : [];
    const formatted = rawList.map(item => ({
      id: item.id || `exp-${Math.random()}`,
      title: item.expense || item.category || 'Expense',
      amount: Number(item.amount || 0),
      category: item.category || 'Others',
      categoryType: item.category_type || 'variable',
      expenseType: item.expense_type || 'debit',
      expenseDate: item.expense_date || '',
      createdAt: item.created_at || '',
      note: item.note || '',
      source: item.source || '',
      isPending: item.status === 'pending_review',
    }));

    localStorage.setItem('aether_expense_list_cache', JSON.stringify(formatted));
    return { expenses: formatted, isLive: true };
  } catch (err) {
    console.warn('Expense list fetch failed, using cache:', err.message);
    const cached = localStorage.getItem('aether_expense_list_cache');
    if (cached) {
      try {
        return { expenses: JSON.parse(cached), isLive: false };
      } catch {
        // ignore
      }
    }
    return { expenses: [], isLive: false };
  }
}
