import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  private handleReset = () => {
    // Try a simple reload first
    window.location.reload();
  }

  private handleHardReset = () => {
     if (window.confirm('This will clear all application data to try and fix the issue. Are you sure you want to proceed? You should restore from a backup afterward.')) {
        // Clear only application-specific data, not everything
        const keysToRemove: string[] = [];
        const keyPattern = /^[a-zA-Z0-9]+_([a-zA-Z]+)_(20\d{2}-20\d{2})$/;
        const profileKey = 'userProfiles';

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (keyPattern.test(key) || key === profileKey)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        window.location.reload();
     }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-xl text-center">
                 <h1 className="text-2xl font-bold text-red-600">Something went wrong.</h1>
                 <p className="text-slate-600">
                    An unexpected error occurred. This might be due to corrupted data, possibly after a data restore.
                 </p>
                 {this.state.error && (
                    <pre className="p-3 bg-slate-50 border rounded-md text-left text-xs text-red-700 whitespace-pre-wrap">
                        {this.state.error.name}: {this.state.error.message}
                    </pre>
                 )}
                 <div className="flex flex-col gap-4 pt-4">
                    <button onClick={this.handleReset} className="w-full py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        Try Reloading the App
                    </button>
                    <button onClick={this.handleHardReset} className="w-full py-2 px-4 rounded-md text-white bg-red-600 hover:bg-red-700">
                        Clear App Data & Reload (Last Resort)
                    </button>
                 </div>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
