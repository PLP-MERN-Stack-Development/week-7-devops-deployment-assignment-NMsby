import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary.jsx';

// Test component that can throw errors conditionally
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

    it('resets error state when handleReset is called', async () => {
        const user = userEvent.setup();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Create a custom fallback to test the reset functionality
        const customFallback = (error, resetErrorBoundary) => (
            <div data-testid="custom-error">
                <h2>Custom Error UI</h2>
                <button onClick={resetErrorBoundary} data-testid="reset-button">
                    Reset Error
                </button>
            </div>
        );

        const { rerender } = render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Should show custom error UI
        expect(screen.getByTestId('custom-error')).toBeInTheDocument();
        expect(screen.getByText('Custom Error UI')).toBeInTheDocument();

        // Click reset button
        await user.click(screen.getByTestId('reset-button'));

        // Re-render with a component that doesn't throw
        rerender(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        // Should now show the normal content
        expect(screen.getByText('No error')).toBeInTheDocument();
        expect(screen.queryByTestId('custom-error')).not.toBeInTheDocument();

        consoleSpy.mockRestore();
    });
});