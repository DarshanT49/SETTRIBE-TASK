import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as authLogin, logout as authLogout, getCurrentUser, getSessionSync } from '../services/auth';
import { startReminderEngine, stopReminderEngine } from '../services/reminderEngine';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize from localStorage session synchronously, then resolve user async
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage if valid
  useEffect(() => {
    const session = getSessionSync();
    if (session?.currentUserId) {
      getCurrentUser().then(user => {
        if (user) {
          setCurrentUser(user);
          startReminderEngine(user.id);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (emailOrId, password) => {
    setLoading(true);
    const result = await authLogin(emailOrId, password);
    if (result.success) {
      setCurrentUser(result.user);
      startReminderEngine(result.user.id);
    }
    setLoading(false);
    return result;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    stopReminderEngine();
    setCurrentUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, refreshUser, isAuthenticated: !!currentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
