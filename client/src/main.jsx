import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeSentry, SentryErrorBoundary } from './config/sentry.js'

// Initialize Sentry before rendering
initializeSentry();

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <SentryErrorBoundary
            fallback={({ error: _error, resetError }) => (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    border: '1px solid #ff6b6b',
                    borderRadius: '8px',
                    margin: '20px',
                    backgroundColor: '#ffe0e0'
                }}>
                    <h2>Something went wrong</h2>
                    <p>An error occurred in the application.</p>
                    <button
                        onClick={resetError}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Try again
                    </button>
                </div>
            )}
            showDialog={false}
        >
            <App />
        </SentryErrorBoundary>
    </StrictMode>,
)