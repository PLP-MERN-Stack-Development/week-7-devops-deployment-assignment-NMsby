import config from '../config/index.js';
import { captureError, captureMessage } from '../config/sentry.js';

class ApiClient {
    constructor() {
        this.baseURL = config.API_URL;
        this.timeout = config.API_TIMEOUT;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const startTime = performance.now();

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            timeout: this.timeout,
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...mergedOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const duration = performance.now() - startTime;

            // Log slow requests
            if (duration > 3000) {
                captureMessage('Slow API request detected', 'warning', {
                    api: {
                        endpoint,
                        duration: `${duration.toFixed(2)}ms`,
                        method: mergedOptions.method || 'GET',
                    },
                });
            }

            if (!response.ok) {
                throw new ApiError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    endpoint,
                    await this.parseErrorResponse(response)
                );
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                const timeoutError = new ApiError(
                    'Request timeout',
                    408,
                    endpoint,
                    { timeout: this.timeout }
                );
                captureError(timeoutError, {
                    api: { endpoint, timeout: this.timeout },
                });
                throw timeoutError;
            }

            if (error instanceof ApiError) {
                captureError(error, {
                    api: {
                        endpoint,
                        method: mergedOptions.method || 'GET',
                        status: error.status,
                    },
                });
                throw error;
            }

            // Network or other errors
            const networkError = new ApiError(
                'Network error',
                0,
                endpoint,
                { originalError: error.message }
            );

            captureError(networkError, {
                api: { endpoint, originalError: error.message },
            });

            throw networkError;
        }
    }

    async parseErrorResponse(response) {
        try {
            return await response.json();
        } catch {
            return { message: response.statusText };
        }
    }

    // HTTP methods
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : null,
        });
    }

    put(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : null,
        });
    }

    patch(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : null,
        });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

class ApiError extends Error {
    constructor(message, status, endpoint, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.endpoint = endpoint;
        this.data = data;
    }
}

export const api = new ApiClient();
export { ApiError };