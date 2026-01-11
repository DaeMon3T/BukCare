import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In a real app, you would log this to Sentry/Datadog
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleGoHome = () => {
    window.location.href = '/';
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 p-8 text-center animate-fade-in">
            
            {/* Icon Blob */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-50 rounded-2xl mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            {/* Text Content */}
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              We encountered an unexpected error. Our team has been notified. 
              Please try refreshing the page or return home.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 text-sm font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
              >
                <Home className="w-4 h-4" />
                Go Back Home
              </button>
            </div>

            {/* Optional Technical Details (Dev Only) */}
            {import.meta.env.DEV && this.state.error && (
                <div className="mt-8 text-left bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-hidden">
                    <p className="text-xs font-mono text-red-500 break-words">
                        {this.state.error.toString()}
                    </p>
                </div>
            )}

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;