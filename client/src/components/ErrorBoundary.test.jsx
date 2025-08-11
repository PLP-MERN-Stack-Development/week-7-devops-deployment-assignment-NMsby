import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary.jsx';

// Test component that can throw errors conditionally
const TestComponent = ({ shouldThrow = false, onRender = () => {} }) => {
    onRender(); // Call the render callback
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
};

describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <TestComponent />
            </ErrorBoundary>
        );

        expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('renders error UI when there is an error', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <TestComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('🚨 Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('An unexpected error occurred. Our team has been notified.')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    it('allows resetting the error state', async () => {
        const user = userEvent.setup();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        let shouldThrow = true;
        let renderCount = 0;

        const onRender = () => {
            renderCount++;
        };

        const TestComponentWrapper = () => (
            <TestComponent shouldThrow={shouldThrow} onRender={onRender} />
        );

        // Initial render with error
        const { rerender } = render(
            <ErrorBoundary>
                <TestComponentWrapper />
            </ErrorBoundary>
        );

        // Error state should be shown
        expect(screen.getByText('🚨 Something went wrong')).toBeInTheDocument();

        // Click try again button
        await act(async () => {
            await user.click(screen.getByText('Try Again'));
        });

        // Change the error condition
        shouldThrow = false;

        // Force re-render after clicking try again
        rerender(
            <ErrorBoundary>
                <TestComponentWrapper />
            </ErrorBoundary>
        );

        // After reset, should show normal content
        expect(screen.getByText('No error')).toBeInTheDocument();

        consoleSpy.mockRestore();
    });
});