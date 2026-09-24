import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { logoutAdmin } from '../services/api';

const TOKEN_KEY = 'tedx-admin-token';
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const login = useCallback((nextToken) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
  }, []);

  const logout = useCallback(async () => {
    const current = localStorage.getItem(TOKEN_KEY);
    if (current) {
      try {
        await logoutAdmin(current);
      } catch {
        // Clear local session even if the server request fails.
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAdmin: Boolean(token),
      login,
      logout,
      clearSession,
    }),
    [token, login, logout, clearSession]
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
