import React, { createContext, useContext } from 'react';
const loggedOut = new URLSearchParams(location.search).has('loggedout');
const user: any = loggedOut ? null : { uid: 'demo-user', email: 'atul@example.com', displayName: 'Atul Saini', getIdToken: async () => '' };
const Ctx = createContext<any>(null);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Ctx.Provider value={{ user, loading: false, isConfigured: true, signInWithGoogle: async () => {}, signInWithEmail: async () => {}, signUpWithEmail: async () => {}, signOut: async () => {}, resetPassword: async () => {} }}>{children}</Ctx.Provider>
);
export const useAuth = () => useContext(Ctx);
