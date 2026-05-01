import React from 'react';
import Button from './ui/Button';
import { HiOutlineRefresh } from 'react-icons/hi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h1>Something went wrong</h1>
            <p>The application encountered an unexpected error. Please try refreshing the page.</p>
            <div className="error-actions">
              <Button icon={HiOutlineRefresh} onClick={() => window.location.reload()}>
                Refresh Application
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="error-details">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
