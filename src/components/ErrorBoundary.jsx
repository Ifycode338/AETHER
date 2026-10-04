import React, { Component } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorHandler } from '@/lib/errorHandler';
import * as Sentry from "@sentry/react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    
    // Log error using centralized error handler
    ErrorHandler.logError(error, 'ErrorBoundary');
    
    // Send error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-[#071f15] via-[#051510] to-[#0a3d2e] flex items-center justify-center p-4">
          <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-white mb-2">Something went wrong</h1>
            <p className="text-white/60 text-sm mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-red-400 text-xs font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-red-400 text-xs cursor-pointer">
                      Error Details
                    </summary>
                    <pre className="text-red-400/80 text-xs mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
