import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Movie+ App ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      // Clear cinepulse caches that could contain corrupted state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('cinepulse_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0c10] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141722] border border-red-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Application Rendering Notice
              </h2>
              <p className="text-sm text-slate-400">
                A client-side runtime exception occurred. You can easily reload or reset the local cache.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#0b0c10] border border-slate-800 rounded-xl p-3 text-left overflow-auto max-h-32 text-xs font-mono text-red-300">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleResetAndReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all border border-slate-700"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                Clear Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
