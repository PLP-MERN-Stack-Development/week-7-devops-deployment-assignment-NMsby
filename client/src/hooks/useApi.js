import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';

export function useApi(endpoint, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const {
        immediate = true,
        method = 'GET',
        dependencies = [],
        ...requestOptions
    } = options;

    const execute = useCallback(async (customOptions = {}) => {
        setLoading(true);
        setError(null);

        try {
            const mergedOptions = { ...requestOptions, ...customOptions };
            const result = await api.request(endpoint, {
                method,
                ...mergedOptions,
            });

            setData(result);
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [endpoint, method, JSON.stringify(requestOptions), ...dependencies]); // Fix: stringify requestOptions

    useEffect(() => {
        if (immediate && method === 'GET') {
            execute();
        }
    }, [execute, immediate, method]);

    const refetch = useCallback(() => execute(), [execute]);

    return {
        data,
        loading,
        error,
        execute,
        refetch,
    };
}

export function useMutation(endpoint, options = {}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = useCallback(async (data, customOptions = {}) => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.request(endpoint, {
                method: 'POST',
                ...options,
                ...customOptions,
                body: data ? JSON.stringify(data) : null,
            });

            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [endpoint, JSON.stringify(options)]); // Fix: stringify options

    return {
        mutate,
        loading,
        error,
    };
}