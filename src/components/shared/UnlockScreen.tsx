import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';

export const UnlockScreen: React.FC = () => {
  const { unlock } = useApp();
  const { user, signOut } = useAuth();
  const [pw, setPw] = useState(''), [busy, setBusy] = useState(false), [bad, setBad] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setBad(false);
    if (!(await unlock(pw))) setBad(true);
    setBusy(false);
  };
  return (
    <div className="min-h-dvh bg-mm-bg flex items-center justify-center px-5">
      <motion.form onSubmit={submit} animate={bad ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-sm panel p-7 text-center">
        <span className="w-14 h-14 mx-auto rounded-2xl bg-mm-accent/10 text-mm-accent flex items-center justify-center"><Lock size={24} /></span>
        <h1 className="text-2xl font-semibold text-mm-text mt-4">Your data is encrypted</h1>
        <p className="text-[15px] text-mm-text2 mt-1.5">Enter your passphrase to unlock MoneyMate on this device.</p>
        <Input className="mt-5" type="password" autoFocus value={pw} onChange={e => setPw(e.target.value)} placeholder="Passphrase" aria-label="Passphrase" autoComplete="current-password" />
        {bad && <p className="text-sm text-mm-negative mt-2" role="alert">That passphrase doesn’t unlock this account.</p>}
        <Button type="submit" size="lg" className="w-full mt-4" disabled={!pw} loading={busy}>Unlock</Button>
        <button type="button" onClick={signOut} className="text-[13px] text-mm-muted hover:text-mm-text mt-4">Not {user?.email}? Sign out</button>
      </motion.form>
    </div>
  );
};
