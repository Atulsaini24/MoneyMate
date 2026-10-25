import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { inputCls, btnPrimary } from '@/components/shared/Sheet';

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
    <div className="min-h-screen bg-mm-bg flex items-center justify-center px-6 relative overflow-hidden">
      <div className="mm-ambient" aria-hidden><i /><i /><i /></div>
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={bad ? { x: [0, -10, 10, -6, 6, 0] } : { opacity: 1, y: 0 }}
        className="relative w-full max-w-sm glass-card-elevated p-7 text-center">
        <span className="w-14 h-14 mx-auto rounded-2xl bg-mm-gold/15 text-mm-gold flex items-center justify-center"><Lock size={24} /></span>
        <h1 className="font-serif text-2xl text-mm-text mt-4">Your data is encrypted</h1>
        <p className="text-sm text-mm-text2 mt-1.5">Enter your passphrase to unlock MoneyMate on this device.</p>
        <input className={`${inputCls} mt-5`} type="password" autoFocus value={pw} onChange={e => setPw(e.target.value)} placeholder="Passphrase" aria-label="Passphrase" />
        {bad && <p className="text-sm text-mm-negative mt-2">That passphrase doesn’t unlock this account.</p>}
        <button disabled={!pw || busy} className={`${btnPrimary} w-full mt-4 flex items-center justify-center gap-2`}>{busy && <Loader2 size={15} className="animate-spin" />} Unlock</button>
        <button type="button" onClick={signOut} className="text-xs text-mm-muted hover:text-mm-text mt-4">Not {user?.email}? Sign out</button>
      </motion.form>
    </div>
  );
};
