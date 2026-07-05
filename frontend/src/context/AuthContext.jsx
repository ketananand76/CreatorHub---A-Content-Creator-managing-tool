import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  firebaseSignInWithEmail,
  firebaseCreateWithEmail,
  firebaseSignInWithGoogle,
  firebaseSignOut,
  getIdToken
} from '../firebase.js';

const AuthContext = createContext();

export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  // Initialize Auth from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (storedUser && storedRefreshToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const res = await fetch(`${API_BASE}/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: storedRefreshToken })
            });
            const data = await res.json();
            if (data.success) {
              setAccessToken(data.accessToken);
              localStorage.setItem('refreshToken', data.refreshToken);
            } else {
              logout();
            }
          } catch (parseErr) {
            console.warn('Stored user data was invalid, clearing auth state.', parseErr);
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error refreshing token on init:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Periodic token refresh every 10 minutes
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const rfToken = localStorage.getItem('refreshToken');
      if (rfToken) {
        try {
          const res = await fetch(`${API_BASE}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: rfToken })
          });
          const data = await res.json();
          if (data.success) {
            setAccessToken(data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
          }
        } catch (e) {
          console.error('Interval token refresh failed:', e);
        }
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Auth fetch wrapper incorporating headers
  const authFetch = async (endpoint, options = {}) => {
    let currentToken = accessToken;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    let res = await fetch(url, { ...options, headers });

    if (res.status === 401 && localStorage.getItem('refreshToken')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: localStorage.getItem('refreshToken') })
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setAccessToken(refreshData.accessToken);
          localStorage.setItem('refreshToken', refreshData.refreshToken);
          headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          res = await fetch(url, { ...options, headers });
        } else {
          logout();
        }
      } catch (err) {
        console.error('AuthFetch Refresh Failure:', err);
      }
    }
    return res;
  };

  // ─────────────────────────────────────────────
  // FIREBASE-BASED AUTH FUNCTIONS
  // ─────────────────────────────────────────────

  // Login by sending credentials to the backend first; fall back to Firebase only if needed.
  const login = async (email, password, _twoFACode = '', isAdminLogin = false) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isAdminLogin })
      });
      const data = await res.json();

      if (data.success && !data.requiresVerification) {
        setUser(data.user);
        setAccessToken(data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      return data;
    } catch (err) {
      console.error('Login Error:', err);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  };

  // Register with Firebase email/password → verify email link → backend creates user
  const register = async (name, email, password, role = 'Creator') => {
    try {
      // Step 1: Create Firebase account (sends email verification automatically)
      const credential = await firebaseCreateWithEmail(email, password);
      const idToken = await getIdToken(credential.user);

      // Step 2: Register user in our MongoDB via backend
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, name, role })
      });
      const data = await res.json();
      return data;
    } catch (firebaseErr) {
      console.error('Firebase Register Error:', firebaseErr.code);
      return {
        success: false,
        message: translateFirebaseError(firebaseErr.code)
      };
    }
  };

  // Check Firebase email verification status and mark account verified in backend
  const verifyOTP = async (_userId, _otp) => {
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        return { success: false, message: 'No active Firebase session. Please login again.' };
      }

      // Reload user to check latest emailVerified status
      await firebaseUser.reload();

      if (!firebaseUser.emailVerified) {
        return {
          success: false,
          message: 'Email not verified yet. Please click the link in your email and try again.'
        };
      }

      const idToken = await getIdToken(firebaseUser);
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setAccessToken(data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      return data;
    } catch (err) {
      console.error('Verify Error:', err);
      return { success: false, message: err.message || 'Verification failed.' };
    }
  };

  // Google Sign In via Firebase Popup → backend records user
  const googleOAuthLogin = async () => {
    try {
      const credential = await firebaseSignInWithGoogle();
      const idToken = await getIdToken(credential.user);

      const res = await fetch(`${API_BASE}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setAccessToken(data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data;
    } catch (firebaseErr) {
      console.error('Google Auth Error:', firebaseErr.code);
      return {
        success: false,
        message: translateFirebaseError(firebaseErr.code)
      };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
    } catch (_) { /* silently fail */ }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  };

  const updateLocalUser = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const syncUser = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error('Error syncing profile:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      verifyOTP,
      googleOAuthLogin,
      logout,
      authFetch,
      updateLocalUser,
      syncUser,
      accessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper: translate Firebase error codes to friendly messages
const translateFirebaseError = (code) => {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email. Please register first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Authentication failed. Please try again.';
  }
};

export const useAuth = () => useContext(AuthContext);
