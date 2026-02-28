import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      let savedToken = null;
      try {
        savedToken = await AsyncStorage.getItem('authToken');
      } catch (storageError) {
        console.warn('AsyncStorage not available, skipping token retrieval');
      }
      
      if (savedToken) {
        setToken(savedToken);
        // Verify token is still valid
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      try {
        await AsyncStorage.removeItem('authToken');
      } catch (storageError) {
        console.warn('Could not clear AsyncStorage');
      }
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;
      try {
        await AsyncStorage.setItem('authToken', newToken);
      } catch (storageError) {
        console.warn('Could not save token to AsyncStorage');
      }
      setToken(newToken);
      setUser(userData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/signup`, {
        email,
        password,
        name,
      });

      const { token: newToken, user: userData } = response.data;
      try {
        await AsyncStorage.setItem('authToken', newToken);
      } catch (storageError) {
        console.warn('Could not save token to AsyncStorage');
      }
      setToken(newToken);
      setUser(userData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Signup failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      try {
        await AsyncStorage.removeItem('authToken');
      } catch (storageError) {
        console.warn('Could not clear AsyncStorage on logout');
      }
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    signup,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
