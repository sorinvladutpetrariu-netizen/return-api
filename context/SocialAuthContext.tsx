import React, { createContext, useContext, ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'com.wisdomhub',
});

// Apple OAuth configuration
const APPLE_CLIENT_ID = process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || 'com.wisdomhub.signin';
const APPLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'com.wisdomhub',
});

interface SocialUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'apple';
}

interface SocialAuthContextType {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const SocialAuthContext = createContext<SocialAuthContextType | undefined>(undefined);

export const SocialAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create request
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUri: GOOGLE_REDIRECT_URI,
        responseType: AuthSession.ResponseType.Code,
      });

      // Get auth code
      const result = await request.promptAsync({
        useProxy: true,
      });

      if (result.type !== 'success') {
        throw new Error('Google sign-in was cancelled');
      }

      // Exchange code for token (in production, do this on backend)
      // For now, we'll use the ID token directly
      const response = await axios.post(`${API_URL}/auth/social-login`, {
        provider: 'google',
        code: result.params.code,
        redirectUri: GOOGLE_REDIRECT_URI,
      });

      const { token, user } = response.data;
      await SecureStore.setItemAsync('authToken', token);

      // Trigger auth update
      // This would typically be done through the main AuthContext
    } catch (err: any) {
      const errorMessage = err.message || 'Google sign-in failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create request
      const request = new AuthSession.AuthRequest({
        clientId: APPLE_CLIENT_ID,
        scopes: ['email', 'name'],
        redirectUri: APPLE_REDIRECT_URI,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
      });

      // Get auth code
      const result = await request.promptAsync({
        useProxy: true,
      });

      if (result.type !== 'success') {
        throw new Error('Apple sign-in was cancelled');
      }

      // Exchange code for token (in production, do this on backend)
      const response = await axios.post(`${API_URL}/auth/social-login`, {
        provider: 'apple',
        code: result.params.code,
        redirectUri: APPLE_REDIRECT_URI,
      });

      const { token, user } = response.data;
      await SecureStore.setItemAsync('authToken', token);

      // Trigger auth update
    } catch (err: any) {
      const errorMessage = err.message || 'Apple sign-in failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value: SocialAuthContextType = {
    signInWithGoogle,
    signInWithApple,
    loading,
    error,
  };

  return <SocialAuthContext.Provider value={value}>{children}</SocialAuthContext.Provider>;
};

export const useSocialAuth = () => {
  const context = useContext(SocialAuthContext);
  if (context === undefined) {
    throw new Error('useSocialAuth must be used within a SocialAuthProvider');
  }
  return context;
};
