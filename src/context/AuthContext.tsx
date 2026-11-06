import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';

const GUEST_KEY = 'moneymate:guest';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  /** Using the app without an account; data stays on this device. */
  guest: boolean;
  continueAsGuest: () => void;
  /** Leave guest mode and go back to the sign-in screen (data is kept). */
  exitGuest: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  isConfigured: false,
  guest: false,
  continueAsGuest: () => {},
  exitGuest: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);
  const [guest, setGuest] = useState<boolean>(() => {
    try { return localStorage.getItem(GUEST_KEY) === '1'; } catch { return false; }
  });
  const setGuestMode = (on: boolean) => {
    setGuest(on);
    try { on ? localStorage.setItem(GUEST_KEY, '1') : localStorage.removeItem(GUEST_KEY); } catch { /* private mode */ }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setGuestMode(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase Auth is not configured. Please add your credentials.');
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth is not configured.');
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!auth) throw new Error('Firebase Auth is not configured.');
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user && name.trim()) {
      await updateProfile(res.user, { displayName: name.trim() });
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error('Firebase Auth is not configured.');
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    setGuestMode(false);
    if (!auth) return;
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      guest: guest && !user,
      continueAsGuest: () => setGuestMode(true),
      exitGuest: () => setGuestMode(false),
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
