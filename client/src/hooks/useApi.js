import { useState, useEffect, useCallback, useMemo } from 'react';
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

    // Memoize the request options to prevent unnecessary re-renders
    const memoizedRequestOptions = useMemo(() => requestOptions, [
        // eslint-disable-next-line react-hooks/exhaustive-deps
        JSON.stringify(requestOptions)
    ]);

    const execute = useCallback(async (customOptions = {}) => {
        setLoading(true);
        setError(null);

        try {
            const mergedOptions = { ...memoizedRequestOptions, ...customOptions };
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
    }, [endpoint, method, memoizedRequestOptions, ...dependencies]);

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

    // Memoize options to prevent unnecessary re-renders
    const memoizedOptions = useMemo(() => options, [
        // eslint-disable-next-line react-hooks/exhaustive-deps
        JSON.stringify(options)
    ]);

    const mutate = useCallback(async (data, customOptions = {}) => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.request(endpoint, {
                method: 'POST',
                ...memoizedOptions,
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
    }, [endpoint, memoizedOptions]);

    return {
        mutate,
        loading,
        error,
    };
}