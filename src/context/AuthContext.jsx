import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USER_PROFILE } from '../data/moviesData';
import { useToast } from './ToastContext';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { showToast } = useToast();
  
  const safeParseUser = (val) => {
    try {
      if (!val) return null;
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.email) {
        return {
          ...INITIAL_USER_PROFILE,
          ...parsed,
          favoriteGenres: Array.isArray(parsed.favoriteGenres) ? parsed.favoriteGenres : []
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(() => {
    return safeParseUser(localStorage.getItem('cinepulse_user'));
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const status = localStorage.getItem('cinepulse_auth_status');
    const stored = localStorage.getItem('cinepulse_user');
    return status === 'true' && !!stored;
  });

  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem('cinepulse_user', JSON.stringify(user));
      localStorage.setItem('cinepulse_auth_status', 'true');
    } else {
      localStorage.setItem('cinepulse_auth_status', 'false');
    }
  }, [user, isAuthenticated]);

  const login = async (email, password) => {
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return { success: false, error: 'Please enter both email and password' };
    }

    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      const data = await api.login(cleanEmail, password);
      if (data && data.requireOtp) {
        return { success: false, requireOtp: true, email: data.email };
      }

      if (data && data.user) {
        const userData = {
          ...INITIAL_USER_PROFILE,
          id: data.user.id || data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'user',
          isVerified: true,
          avatar: data.user.avatar || INITIAL_USER_PROFILE.avatar,
          favoriteGenres: Array.isArray(data.user.favoriteGenres) ? data.user.favoriteGenres : []
        };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('cinepulse_user', JSON.stringify(userData));
        if (data.token) {
          localStorage.setItem('cinepulse_token', data.token);
        }
        localStorage.setItem('cinepulse_auth_status', 'true');
      }
      showToast(`Welcome back, ${data?.user?.name || cleanEmail}!`, 'success');
      return { success: true };
    } catch (err) {
      if (err.requireVerification) {
        showToast('Please verify your email address to activate your account.', 'warning');
        return { success: false, requireVerification: true, email: err.email || email };
      }
      if (err.requireOtp) {
        return { success: false, requireOtp: true, email: err.email || email };
      }

      // If backend fails completely or in local offline mode
      const errMsg = err.message || 'Login failed';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const register = async (name, email, password) => {
    if (!name || !email || !password) {
      showToast('Please fill all registration fields.', 'error');
      return { success: false, error: 'Please fill all fields' };
    }

    try {
      const data = await api.register(name, email, password, INITIAL_USER_PROFILE.favoriteGenres);
      if (data && data.requireVerification) {
        showToast('Security verification code sent to your email!', 'info');
        return { success: true, requireVerification: true, email: data.email || email };
      }

      // If registered immediately without verification
      if (data && data.user) {
        setUser({
          ...INITIAL_USER_PROFILE,
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'user',
          isVerified: data.user.isVerified ?? true,
          avatar: data.user.avatar || INITIAL_USER_PROFILE.avatar
        });
        setIsAuthenticated(true);
        showToast(`Account created successfully! Welcome, ${name}.`, 'success');
        return { success: true };
      }
      return { success: true };
    } catch (err) {
      const errMsg = err.message || 'Registration failed';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const verifyEmail = async (email, otp) => {
    if (!email || !otp) {
      showToast('Please enter the 6-digit verification code.', 'error');
      return { success: false, error: 'Please enter verification code' };
    }

    try {
      const data = await api.verifyEmail(email, otp);
      if (data && data.user) {
        setUser({
          ...INITIAL_USER_PROFILE,
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'user',
          isVerified: true,
          avatar: data.user.avatar || INITIAL_USER_PROFILE.avatar,
          favoriteGenres: data.user.favoriteGenres || INITIAL_USER_PROFILE.favoriteGenres
        });
      }
      setIsAuthenticated(true);
      showToast('Account verified and created successfully! Welcome to Movie+.', 'success');
      return { success: true };
    } catch (err) {
      const errMsg = err.message || 'Verification failed';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const verifyLoginOtp = async (email, otp) => {
    if (!email || !otp) {
      showToast('Please enter the 6-digit verification code.', 'error');
      return { success: false, error: 'Please enter verification code' };
    }

    try {
      const data = await api.verifyLoginOtp(email, otp);
      if (data && data.user) {
        setUser({
          ...INITIAL_USER_PROFILE,
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'user',
          isVerified: true,
          avatar: data.user.avatar || INITIAL_USER_PROFILE.avatar,
          favoriteGenres: data.user.favoriteGenres || INITIAL_USER_PROFILE.favoriteGenres
        });
      }
      setIsAuthenticated(true);
      showToast('Login verified successfully!', 'success');
      return { success: true };
    } catch (err) {
      const errMsg = err.message || 'Login verification failed';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const resendOtp = async (email, type = 'register') => {
    if (!email) {
      showToast('Email address is missing.', 'error');
      return { success: false };
    }

    try {
      const data = await api.resendOtp(email, type);
      showToast(data.message || 'A fresh verification code was sent to your email.', 'success');
      return { success: true };
    } catch (err) {
      const errMsg = err.message || 'Failed to resend verification code';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.setItem('cinepulse_auth_status', 'false');
    localStorage.removeItem('cinepulse_token');
    localStorage.removeItem('cinepulse_user');
    showToast('You have been logged out.', 'info');
  };

  const updateProfile = (updatedData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedData };
      localStorage.setItem('cinepulse_user', JSON.stringify(next));
      return next;
    });

    api.updateProfile(updatedData).catch(() => {});
    showToast('Profile preferences updated!', 'success');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        verifyEmail,
        verifyLoginOtp,
        resendOtp,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
