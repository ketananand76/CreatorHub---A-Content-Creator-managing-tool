const fs = require('fs');
let code = fs.readFileSync('frontend/src/context/AuthContext.jsx', 'utf8');

// 1. Add firebase imports
const imports = `import { firebaseCreateWithEmail, firebaseSignInWithEmail, firebasePasswordReset, getIdToken } from '../firebase';\n`;
if (!code.includes('firebaseCreateWithEmail')) {
  code = code.replace(/import \{ createContext, useState, useEffect, useContext \} from 'react';/, "import { createContext, useState, useEffect, useContext } from 'react';\n" + imports);
}

// 2. Replace register
const newRegister = `
  const register = async (name, email, password, role = 'Creator') => {
    try {
      const credential = await firebaseCreateWithEmail(email, password);
      // Backend sync not strictly required here if they must verify email first,
      // but we can just tell them it's sent.
      return { success: true, message: 'Verification email sent. Please check your inbox and verify your email before logging in.' };
    } catch (err) {
      console.error('Firebase Register Error:', err);
      let msg = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'Email is already registered.';
      if (err.code === 'auth/weak-password') msg = 'Password is too weak. Please use at least 6 characters.';
      return { success: false, message: msg };
    }
  };`;
  
code = code.replace(/const register = async \([\s\S]*?^  \};/m, newRegister.trim());

// 3. Replace login
const newLogin = `
  const login = async (identifier, password, isAdminLogin = false) => {
    if (isAdminLogin) {
      try {
        const res = await fetch(\`\${API_BASE}/auth/admin-login\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password, isAdminLogin })
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
        return { success: false, message: 'Admin login failed.' };
      }
    }

    try {
      const credential = await firebaseSignInWithEmail(identifier, password);
      if (!credential.user.emailVerified) {
        return { success: false, requiresVerification: true, message: 'Email not verified. Please check your inbox for the verification link.' };
      }

      const idToken = await getIdToken(credential.user);
      const res = await fetch(\`\${API_BASE}/auth/firebase-sync\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, name: credential.user.displayName })
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
      console.error('Firebase Login Error:', err);
      let msg = 'Login failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      }
      return { success: false, message: msg };
    }
  };`;

code = code.replace(/const login = async \([\s\S]*?^  \};/m, newLogin.trim());

// 4. Replace forgotPassword
const newForgot = `
  const forgotPassword = async (email) => {
    try {
      await firebasePasswordReset(email);
      return { success: true, message: 'Password reset email sent! Check your inbox.' };
    } catch (err) {
      console.error('Firebase Forgot Password Error:', err);
      return { success: false, message: 'Failed to send reset email. Ensure the email is registered.' };
    }
  };`;

code = code.replace(/const forgotPassword = async \([\s\S]*?^  \};/m, newForgot.trim());

// 5. Remove verifyOTP, resetPassword, verifyEmailToken
code = code.replace(/const verifyOTP = async \([\s\S]*?^  \};/m, '');
code = code.replace(/const resetPassword = async \([\s\S]*?^  \};/m, '');
code = code.replace(/const verifyEmailToken = async \([\s\S]*?^  \};/m, '');

// Also remove them from context provider value
code = code.replace(/verifyOTP,\s*/g, '');
code = code.replace(/resetPassword,\s*/g, '');
code = code.replace(/verifyEmailToken,\s*/g, '');

fs.writeFileSync('frontend/src/context/AuthContext.jsx', code);
console.log('AuthContext.jsx updated!');
