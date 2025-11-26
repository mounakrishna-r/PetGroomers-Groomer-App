import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Groomer, AuthState } from '../types';
import GroomerAPI from '../services/GroomerAPI';

interface AuthContextType extends AuthState {
  login: (emailOrPhone: string, password: string) => Promise<{ 
    success: boolean; 
    error?: string;
  }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phone: string, otp: string, isLoginFlow?: boolean) => Promise<{ 
    success: boolean; 
    error?: string; 
    message?: string;
    verificationOnly?: boolean;
    loginReady?: boolean;
  }>;
  logout: () => Promise<void>;
  updateGroomerData: (groomer: Groomer) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    groomer: null,
    token: null,
  });
  const [loading, setLoading] = useState(true);

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuth = await GroomerAPI.isAuthenticated();
      if (isAuth) {
        const groomerData = await GroomerAPI.getStoredGroomerData();
        if (groomerData) {
          setAuthState({
            isAuthenticated: true,
            groomer: groomerData,
            token: 'stored', // Token is stored securely
          });
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrPhone: string, password: string) => {
    try {
      const response = await GroomerAPI.login({ emailOrPhone, password });
      
      if (response.success && response.data) {
        setAuthState({
          isAuthenticated: true,
          groomer: response.data.groomer,
          token: response.data.token,
        });
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (data: any) => {
    try {
      console.log('AuthContext: Sending registration data:', data);
      const response = await GroomerAPI.register(data);
      console.log('AuthContext: Registration response:', response);
      
      if (response.success) {
        // GroomerAPI now returns token and groomer data after successful registration
        if (response.data) {
          // Automatically log in the user after successful registration
          setAuthState({
            isAuthenticated: true,
            groomer: response.data.groomer,
            token: response.data.token,
          });
        }
        return { success: true };
      } else {
        console.error('AuthContext: Registration failed:', response.error);
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('AuthContext: Registration network error:', error);
      return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const verifyOTP = async (phone: string, otp: string, isLoginFlow?: boolean) => {
    try {
      const response = await GroomerAPI.verifyOTP(phone, otp);
      
      if (response.success) {
        if (response.data && response.data.groomer && response.data.token) {
          // Full authentication (registration flow or already logged in user)
          setAuthState({
            isAuthenticated: true,
            groomer: response.data.groomer,
            token: response.data.token,
          });
          return { success: true, message: 'Verified and logged in successfully' };
        } else {
          // Verification only 
          if (isLoginFlow) {
            return { 
              success: true, 
              message: 'Phone verified! You can now login with your phone and password.',
              verificationOnly: true,
              loginReady: true
            };
          }
          
          // Regular verification only (registration flow)
          return { 
            success: true, 
            message: response.message || 'Phone verified successfully. You can now login.',
            verificationOnly: true
          };
        }
      } else {
        return { success: false, error: response.error || 'OTP verification failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      console.log('🔐 Starting logout process...');
      await GroomerAPI.logout();
      console.log('🗑️ Storage cleared successfully');
      
      setAuthState({
        isAuthenticated: false,
        groomer: null,
        token: null,
      });
      
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if there's an error, we should still clear the auth state
      // to prevent the user from being stuck
      setAuthState({
        isAuthenticated: false,
        groomer: null,
        token: null,
      });
      throw error; // Re-throw so the UI can handle it
    }
  };

  const updateGroomerData = (groomer: Groomer) => {
    setAuthState(prev => ({
      ...prev,
      groomer,
    }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    verifyOTP,
    logout,
    updateGroomerData,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}