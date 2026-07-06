import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const API_BASE_RAW = String(
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_TARGET ||
    import.meta.env.VITE_API_URL ||
    '/api'
  );

  // Backend mounts auth routes under /api/auth (see backend/server.js).
  // If the env var points to the bare backend origin, prefix it with /api.
  const API_BASE = (() => {
    const base = API_BASE_RAW.replace(/\/$/, '');
    return base.includes('/api') ? base : `${base}/api`;
  })();
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
            const raw = await res.text();
            let data;
            try { data = JSON.parse(raw); } catch { data = null; }

            if (data?.success) {
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

  // Social login popup handling replaces Firebase redirects.

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
          // If refresh endpoint returns HTML/404, avoid breaking app state
          try {
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          } catch (_) {}
          setUser(null);
          setAccessToken(null);
        }
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Auth fetch wrapper incorporating headers
  // Never throws — always returns a response-like object so callers can safely check res.ok
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

    let res;
    try {
      res = await fetch(url, { ...options, headers });
    } catch {
      // Network failure (ERR_CONNECTION_CLOSED, offline, CORS, etc.)
      // Return a safe object so callers can do res.ok check without crashing
      return { ok: false, status: 0, json: async () => ({ success: false, message: 'Network error: unable to reach server.' }) };
    }

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

    // Safely wrap res.json() so callers never crash on HTML error pages
    const safeJson = async () => {
      try {
        const text = await res.text();
        return JSON.parse(text);
      } catch {
        return { success: false, message: `Server error ${res.status}: endpoint not available.` };
      }
    };

    return { ok: res.ok, status: res.status, json: safeJson };
  };

  // ─────────────────────────────────────────────
  // DIRECT BACKEND AUTH FUNCTIONS
  // ─────────────────────────────────────────────

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
        message: err.message || 'Login failed. Please try again.'
      };
    }
  };

  const register = async (name, email, password, role = 'Creator') => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Register Error:', err);
      return {
        success: false,
        message: err.message || 'Registration failed. Please try again.'
      };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }) // OTP is omitted, backend checks isVerified status directly
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

  const verifyEmailToken = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
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
      console.error('Verify Email Token Error:', err);
      return { success: false, message: err.message || 'Email verification failed.' };
    }
  };

  const socialLogin = async (platform, idToken) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${API_BASE}/auth/social-login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ platform, idToken })
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
      console.error('Social Login Error:', err);
      return { success: false, message: err.message || 'Social login failed' };
    }
  };

  const logout = async () => {
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

  const socialLoginSuccess = (data) => {
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('refreshToken', data.refreshToken);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      verifyOTP,
      verifyEmailToken,
      socialLogin,
      socialLoginSuccess,
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
