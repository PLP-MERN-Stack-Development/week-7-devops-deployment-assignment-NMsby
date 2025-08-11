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

        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Error state should be shown
        expect(screen.getByText('🚨 Something went wrong')).toBeInTheDocument();

        // Click try again button
        await user.click(screen.getByText('Try Again'));

        // Re-render with no error
        rerender(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByText('No error')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });
});