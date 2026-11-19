'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ============================================================================
 * REACT UNIT III: CUSTOM HOOKS FOR LOGIC REUSE
 * ============================================================================
 * Short, clean, declarative abstractions for common component tasks.
 */

/**
 * 1. useAuth Hook
 * Manages current logged-in user state, authentication checks, and logout.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isOrganiser: user?.role === 'organiser',
    isStudent: user?.role === 'student',
    refetchUser: fetchUser,
    logout,
  };
}

/**
 * 2. useFetch Hook
 * Declarative data fetching hook managing data, loading, error, and refetch.
 */
export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 3. useDebounce Hook
 * Delays updating a state value until a specified timeout has elapsed.
 * Perfect for search bars and auto-suggestions.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 4. useToggle Hook
 * Simple boolean toggle hook for modals, dropdowns, and drawers.
 */
export function useToggle(initialValue = false) {
  const [state, setState] = useState(initialValue);
  const toggle = useCallback(() => setState((prev) => !prev), []);
  const setOn = useCallback(() => setState(true), []);
  const setOff = useCallback(() => setState(false), []);

  return [state, toggle, setOn, setOff];
}

/**
 * 5. useDocumentTitle Hook
 * Dynamically updates document title with cleanup.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | Eventra`;
    }
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
