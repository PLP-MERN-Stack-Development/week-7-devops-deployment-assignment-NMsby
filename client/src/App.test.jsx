import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

// Mock the API hook
vi.mock('./hooks/useApi.js', () => ({
    useApi: vi.fn()
}));

import { useApi } from './hooks/useApi.js';

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        useApi.mockReturnValue({
            data: null,
            loading: false,
            error: null
        });

        render(<App />);
        expect(screen.getByText('MERN Stack Deployment')).toBeInTheDocument();
    });

    it('displays loading state', () => {
        useApi.mockReturnValue({
            data: null,
            loading: true,
            error: null
        });

        render(<App />);
        expect(screen.getByText('Connecting to API...')).toBeInTheDocument();
    });

    it('displays API data when loaded', async () => {
        const mockApiData = {
            message: 'MERN Stack API is running!',
            version: '1.0.0',
            environment: 'test'
        };

        useApi.mockReturnValue({
            data: mockApiData,
            loading: false,
            error: null
        });

        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('✅ API Connected: MERN Stack API is running!')).toBeInTheDocument();
        });
    });

    it('displays error state', () => {
        const mockError = { message: 'Network error' };

        useApi.mockReturnValue({
            data: null,
            loading: false,
            error: mockError
        });

        render(<App />);
        expect(screen.getByText('API Error: Network error')).toBeInTheDocument();
    });

    it('increments counter when button is clicked', async () => {
        const user = userEvent.setup();

        useApi.mockReturnValue({
            data: null,
            loading: false,
            error: null
        });

        render(<App />);

        const button = screen.getByRole('button', { name: /count is 0/ });
        await user.click(button);

        expect(screen.getByRole('button', { name: /count is 1/ })).toBeInTheDocument();
    });

    it('shows development tools in development mode', () => {
        // Mock development environment
        vi.doMock('./config/index.js', () => ({
            default: {
                IS_DEVELOPMENT: true,
                // ... other config values
            }
        }));

        useApi.mockReturnValue({
            data: null,
            loading: false,
            error: null
        });

        render(<App />);
        expect(screen.getByText('Development Tools')).toBeInTheDocument();
    });
});