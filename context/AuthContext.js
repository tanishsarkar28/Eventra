'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

/**
 * ============================================================================
 * INT252 UNIT VI: GLOBAL STATE MANAGEMENT USING REACT CONTEXT API
 * ============================================================================
 * Solves the state-sharing challenge in React applications.
 * Instead of prop-drilling user data through multiple component levels,
 * AuthContext provides global user authentication state to the entire tree.
 * 
 * Also demonstrates INT252 Unit III:
 * - useCallback: memoizes functions so their references don't change on re-render.
 * - useMemo: memoizes the context value object to prevent unnecessary consumer re-renders.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch current authenticated user
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
      setError(err.message || 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Load user on initial mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 3. Centralized logout action
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  // 4. Centralized login action
  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      await fetchUser();
      return { success: true };
    }
    return { success: false, message: data.message || 'Login failed' };
  }, [fetchUser]);

  // 5. INT252 Unit III: useMemo memoizes the context value object
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isOrganiser: user?.role === 'organiser',
      isStudent: user?.role === 'student',
      login,
      logout,
      refetchUser: fetchUser,
    }),
    [user, loading, error, login, logout, fetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom Hook to consume AuthContext cleanly in any component.
 * Example: const { user, isAdmin, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
