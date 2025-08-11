import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary.jsx';

// Component that throws an error
const ThrowError = ({ shouldThrow = false }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
};

describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('renders error UI when there is an error', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('🚨 Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('An unexpected error occurred. Our team has been notified.')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it('allows resetting the error state', async () => {
        const user = userEvent.setup();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Create a component that can toggle between error and no error
        const ToggleErrorComponent = ({ showError }) => {
            if (showError) {
                throw new Error('Test error');
            }
            return <div>No error</div>;
        };

        // Initial render with error
        const { rerender } = render(
            <ErrorBoundary>
                <ToggleErrorComponent showError={true} />
            </ErrorBoundary>
        );

        // Error state should be shown
        expect(screen.getByText('🚨 Something went wrong')).toBeInTheDocument();

        // Click try again button to reset error boundary
        await user.click(screen.getByText('Try Again'));

        // Now re-render with no error - the error boundary should reset
        rerender(
            <ErrorBoundary>
                <ToggleErrorComponent showError={false} />
            </ErrorBoundary>
        );

        // After clicking "Try Again" and re-rendering, we should see the normal content
        expect(screen.getByText('No error')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });
});