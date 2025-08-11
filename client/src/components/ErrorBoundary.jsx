import { Component } from 'react';
import { captureError } from '../config/sentry.js';
import config from '../config/index.js';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error,
            errorInfo
        });

        // Log to Sentry with context
        captureError(error, {
            errorBoundary: {
                componentStack: errorInfo.componentStack,
                errorBoundary: this.constructor.name
            },
            props: this.props
        });

        if (config.IS_DEVELOPMENT) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.handleReset);
            }

            return (
                <div className="error-boundary">
                    <div className="error-container">
                        <h2>🚨 Something went wrong</h2>
                        <p>An unexpected error occurred. Our team has been notified.</p>

                        {config.IS_DEVELOPMENT && this.state.error && (
                            <details style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5' }}>
                                <summary>Error Details (Development)</summary>
                                <pre style={{ color: '#d32f2f', fontSize: '0.875rem', overflowX: 'auto' }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="error-actions">
                            <button onClick={this.handleReset} className="btn-primary">
                                Try Again
                            </button>
                            <button onClick={() => window.location.reload()} className="btn-secondary">
                                Reload Page
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