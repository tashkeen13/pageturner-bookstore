import { createContext, useCallback, useMemo, useState } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('pageturner-user') || 'null');
  } catch {
    localStorage.removeItem('pageturner-user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);

  const saveSession = useCallback((token, nextUser) => {
    localStorage.setItem('pageturner-token', token);
    localStorage.setItem('pageturner-user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(async credentials => {
    const response = await api.post('/auth/login', credentials);
    saveSession(response.data.token, response.data.user);
    return response.data.user;
  }, [saveSession]);

  const register = useCallback(async details => {
    await api.post('/auth/register', details);
    // The API returns a user on registration but issues a token only on login.
    return login({ email: details.email, password: details.password });
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('pageturner-token');
    localStorage.removeItem('pageturner-user');
    setUser(null);
  }, []);

  const updateUser = useCallback(nextUser => {
    localStorage.setItem('pageturner-user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user && localStorage.getItem('pageturner-token')),
    login,
    register,
    updateUser,
    logout
  }), [user, login, register, updateUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
