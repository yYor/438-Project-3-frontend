import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  email: string;
  id: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@birdwatcher_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // load user from async storage on app start
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // get user from async storage
      const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // check if user exists in async storage
      const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.email === email) {
          // user exists, set as current user
          setUser(user);
          return { error: null };
        }
      }
      // user doesn't exist
      return { error: { message: 'User not found. Please sign up first.' } };
    } catch (error: any) {
      return { error: { message: error.message || 'Sign in failed' } };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // save user to async storage
      const newUser: User = {
        email,
        id: `user_${Date.now()}`,
        created_at: new Date().toISOString(),
      };3
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Sign up failed' } };
    }
  };

  const signOut = async () => {
    try {
      // remove user from async storage
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // value to pass to the auth context provider
  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
