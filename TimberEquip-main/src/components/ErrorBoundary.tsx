import * as React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { captureBrowserException } from '../services/sentry';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    captureBrowserException(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'ErrorBoundary',
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-8">
          <div className="max-w-xl w-full bg-surface border border-line p-12 shadow-2xl text-center">
            <div className="w-20 h-20 bg-accent/10 text-accent flex items-center justify-center rounded-full mx-auto mb-8">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">System <span className="text-accent">Error</span></h1>
            <p className="text-muted font-medium mb-12 leading-relaxed">
              A critical exception has occurred in the Forestry Equipment Sales system. 
              The session has been suspended to protect data integrity.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="btn-industrial btn-accent py-4 px-8 flex items-center justify-center"
              >
                <RefreshCw size={18} className="mr-2" />
                Restart System
              </button>
              <a 
                href="/"
                className="btn-industrial bg-ink text-white py-4 px-8 flex items-center justify-center"
              >
                <Home size={18} className="mr-2" />
                Return Home
              </a>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-12 p-6 bg-ink text-data text-left font-mono text-[10px] overflow-auto max-h-48 border border-line">
                <p className="font-bold mb-2 uppercase tracking-widest text-white">Error Trace:</p>
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
