import React, { Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Ensure browser does not restore stale scroll offsets
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

// Smart TV WebView compatibility polyfill for AbortSignal.timeout (Chromium < 103)
if (typeof window !== 'undefined' && typeof AbortSignal !== 'undefined' && !AbortSignal.timeout) {
  AbortSignal.timeout = function (ms) {
    const controller = new AbortController();
    setTimeout(() => {
      try {
        controller.abort(new DOMException('The operation timed out', 'TimeoutError'));
      } catch {
        controller.abort();
      }
    }, ms);
    return controller.signal;
  };
}

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL HUD RUNTIME ERROR:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#040711',
          color: '#00f0ff',
          padding: '40px',
          fontFamily: 'monospace',
          zIndex: 999999,
          overflow: 'auto',
          border: '2px solid #ef4444'
        }}>
          <h2 style={{ color: '#ef4444', fontSize: '20px', marginBottom: '10px' }}>
            [!] J.A.R.V.I.S. SYSTEM FAULT DETECTED
          </h2>
          <p style={{ color: '#fbbf24', fontSize: '14px', marginBottom: '20px' }}>
            {this.state.error?.toString()}
          </p>
          <pre style={{
            background: 'rgba(2, 6, 23, 0.9)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            padding: '16px',
            color: '#94a3b8',
            fontSize: '12px',
            borderRadius: '6px',
            whiteSpace: 'pre-wrap'
          }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: 'rgba(0, 240, 255, 0.2)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold'
            }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>,
)
