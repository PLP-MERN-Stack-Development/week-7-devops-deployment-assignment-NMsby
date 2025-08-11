import { useEffect, useState } from 'react';
import { useApi } from './hooks/useApi.js';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import { setUserContext } from './config/sentry.js';
import config from './config/index.js';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function AppContent() {
    const [count, setCount] = useState(0);
    const { data: apiData, loading, error } = useApi('/');

    useEffect(() => {
        // Set user context for error tracking (example)
        setUserContext({
            id: 'user_123',
            username: 'demo_user',
        });
    }, []);

    const handleTestError = () => {
        throw new Error('Test error from React component');
    };

    return (
        <>
            <div>
                <a href="https://vite.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={ reactLogo } className="logo react" alt="React logo" />
                </a>
            </div>

            <h1>MERN Stack Deployment</h1>

            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.jsx</code> and save to test HMR
                </p>
            </div>

            <div className="card">
                <h3>Backend API Status</h3>
                {loading && <LoadingSpinner text="Connecting to API..." />}
                {error && (
                    <div style={{ color: '#ff6b6b', padding: '1rem', border: '1px solid #ff6b6b', borderRadius: '4px' }}>
                        <strong>API Error:</strong> {error.message}
                    </div>
                )}
                {apiData && (
                    <div style={{ color: '#28a745', padding: '1rem', border: '1px solid #28a745', borderRadius: '4px' }}>
                        <strong>✅ API Connected:</strong> {apiData.message}
                        <br />
                        <small>Version: {apiData.version} | Environment: {apiData.environment}</small>
                    </div>
                )}
            </div>

            <div className="card">
                <h3>Application Info</h3>
                <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                    <li><strong>App Version:</strong> {config.APP_VERSION}</li>
                    <li><strong>Environment:</strong> {config.NODE_ENV}</li>
                    <li><strong>Built:</strong> {config.BUILD_TIME}</li>
                    <li><strong>Debug Mode:</strong> {config.ENABLE_DEBUG ? '✅' : '❌'}</li>
                    <li><strong>Analytics:</strong> {config.ENABLE_ANALYTICS ? '✅' : '❌'}</li>
                </ul>
            </div>

            {config.IS_DEVELOPMENT && (
                <div className="card">
                    <h3>Development Tools</h3>
                    <button
                        onClick={handleTestError}
                        style={{
                            backgroundColor: '#ff6b6b',
                            color: 'white',
                            marginRight: '0.5rem'
                        }}
                    >
                        Test Error Boundary
                    </button>
                    <button
                        onClick={() => console.log('Console test')}
                        style={{ backgroundColor: '#6c757d', color: 'white' }}
                    >
                        Test Console
                    </button>
                </div>
            )}

            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    );
}

function App() {
  return (
    <ErrorBoundary>
        <AppContent />
    </ErrorBoundary>
  );
}

export default App
