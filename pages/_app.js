import React from 'react';
import Script from 'next/script';
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from 'next-themes';
import { appWithTranslation } from 'next-i18next';
import '../styles/globals.css';

// Validate environment variables at startup (server-side only)
if (typeof window === 'undefined') {
  const { validateEnv } = require('../lib/validateEnv');
  validateEnv();
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>An unexpected error occurred. Please try refreshing the page.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: '0.75rem 2rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="data-theme" defaultTheme="light">
        <ErrorBoundary>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Component {...pageProps} />
          <Script
            src="https://analysis.cryptomonkeys.cc/script.js"
            data-website-id="2e2456f5-72a7-4815-b750-0a96a4cb2"
            strategy="afterInteractive"
          />
        </ErrorBoundary>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default appWithTranslation(MyApp);