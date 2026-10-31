import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, pass: string) => Promise<void>;
  register: (username: string, email: string, pass: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fp_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      localStorage.removeItem('fp_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (usernameOrEmail: string, pass: string) => {
    const res = await api.login(usernameOrEmail, pass);
    localStorage.setItem('fp_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (username: string, email: string, pass: string) => {
    const res = await api.register(username, email, pass);
    localStorage.setItem('fp_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const guestLogin = async () => {
    throw new Error('Official account registration is required to place verified predictions. Please Sign Up.');
  };

  const logout = () => {
    localStorage.removeItem('fp_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        guestLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
