import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    const route = this.props.fallbackRoute || '/';
    window.location.href = route;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              {this.props.componentName && (
                <div className="font-medium mb-2">
                  Error in {this.props.componentName} component
                </div>
              )}
              <div className="text-sm text-muted-foreground mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80 transition-colors"
                >
                  <Home className="h-3.5 w-3.5" />
                  Go to Dashboard
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-3 py-1.5 border border-border text-foreground rounded text-sm hover:bg-accent transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}