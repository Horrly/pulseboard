import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app and exposes:
 *
 *   user          — the authenticated user object (or null)
 *   loading       — true while the initial /me fetch is in flight
 *   login(email, password) — authenticates and stores tokens
 *   logout()      — clears tokens and user state
 *   updateUser(partial) — merge-update the local user object after a
 *                         preferences PATCH so UI re-renders without a refetch
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to rehydrate the session from localStorage tokens.
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('pb_access');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me/');
      setUser(data);
    } catch {
      // Token may be expired and refresh failed — clear everything.
      localStorage.removeItem('pb_access');
      localStorage.removeItem('pb_refresh');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password });
    localStorage.setItem('pb_access', data.access);
    localStorage.setItem('pb_refresh', data.refresh);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/', {});
    } catch {
      // Best-effort — always clear client state regardless.
    }
    localStorage.removeItem('pb_access');
    localStorage.removeItem('pb_refresh');
    setUser(null);
  };

  /** Merge a partial update into the cached user object. */
  const updateUser = (partial) => {
    setUser((prev) => prev ? { ...prev, ...partial } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
