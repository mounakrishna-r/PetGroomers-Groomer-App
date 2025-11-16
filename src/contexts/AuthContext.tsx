import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import GroomerAPI, { Groomer } from '../services/GroomerAPI';

interface AuthContextType {
  groomer: Groomer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateGroomer: (groomerData: Groomer) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [groomer, setGroomer] = useState<Groomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      await GroomerAPI.initialize();
      
      if (GroomerAPI.isAuthenticated()) {
        const storedGroomer = await GroomerAPI.getStoredGroomerData();
        if (storedGroomer) {
          setGroomer(storedGroomer);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password?: string) => {
    try {
      const response = await GroomerAPI.login({ identifier, password });
      
      if (response.success && response.groomer) {
        setGroomer(response.groomer);
        return { success: true, message: 'Login successful' };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  const logout = async () => {
    try {
      await GroomerAPI.logout();
      setGroomer(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateGroomer = (groomerData: Groomer) => {
    setGroomer(groomerData);
  };

  const value: AuthContextType = useMemo(() => ({
    groomer,
    isAuthenticated: !!groomer,
    isLoading,
    login,
    logout,
    updateGroomer,
  }), [groomer, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};