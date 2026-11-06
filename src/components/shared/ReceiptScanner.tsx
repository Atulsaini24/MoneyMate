import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, ScanLine, CircleAlert, ImageUp, LogIn } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import { cloud } from '@/lib/api';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui';

type Phase = { kind: 'pick' } | { kind: 'scanning'; preview: string } | { kind: 'error'; message: string; preview?: string };

export const ReceiptScanner: React.FC = () => {
  const { scannerOpen, setScannerOpen, openAddSheet } = useUI();
  const { user, exitGuest, isConfigured } = useAuth();
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useRef<string | null>(null);
  const freePreview = () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); previewUrl.current = null; };

  useEffect(() => { if (scannerOpen) setPhase({ kind: 'pick' }); else freePreview(); }, [scannerOpen]);

  const close = () => setScannerOpen(false);
  const manual = () => { close(); setTimeout(() => openAddSheet({ type: 'expense' }), 150); };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    freePreview();
    const preview = URL.createObjectURL(file);
    previewUrl.current = preview;
    setPhase({ kind: 'scanning', preview });
    try {
      const r = await cloud.scanReceipt(file);
      const itemNote = r.items.length ? r.items.map(i => `${i.name} ${i.amount}`).join(', ') : '';
      close();
      openAddSheet({
        prefill: {
          type: 'expense', amount: r.amount, description: r.merchant, category: r.category,
          date: r.date || undefined, paymentMethod: r.paymentMethod || undefined,
          notes: itemNote ? `Scanned: ${itemNote}`.slice(0, 280) : 'Scanned from receipt',
        },
      });
    } catch (e: any) {
      setPhase({ kind: 'error', preview, message: e?.message || 'Receipt could not be read.' });
    }
  };

  return (
    <Dialog open={scannerOpen} onClose={close} title="Scan a receipt"
      description={user ? 'MoneyMate reads the total, shop, date and category. You check everything before it’s saved.' : undefined}>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />

      {!user ? (
        <div className="rounded-2xl bg-mm-bg2 p-5 text-center">
          <span className="w-12 h-12 mx-auto rounded-2xl bg-mm-accent/10 text-mm-accent flex items-center justify-center mb-3"><ScanLine size={22} /></span>
          <p className="text-[15px] font-semibold text-mm-text">Receipt scanning needs an account</p>
          <p className="text-sm text-mm-text2 mt-1.5 leading-relaxed">
            {isConfigured ? 'Photos are read by an AI service on the server, so it only works when you’re signed in. Your data on this device comes with you.'
              : 'Photos are read by an AI service on the server. Accounts aren’t turned on for this installation, so scanning isn’t available here.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <Button variant="secondary" className="flex-1" onClick={manual}>Enter it manually</Button>
            {isConfigured && <Button icon={LogIn} className="flex-1" onClick={() => { close(); exitGuest(); }}>Sign in</Button>}
          </div>
        </div>
      ) : phase.kind === 'pick' ? (
        <button onClick={() => inputRef.current?.click()}
          className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-mm-line/20 bg-mm-bg2 flex flex-col items-center justify-center gap-3 text-mm-text2 hover:border-mm-accent/60 hover:text-mm-text transition-colors">
          <span className="w-14 h-14 rounded-2xl bg-mm-accent/10 text-mm-accent flex items-center justify-center"><Camera size={26} strokeWidth={1.7} /></span>
          <span className="text-[15px] font-semibold text-mm-text">Take a photo or choose one</span>
          <span className="text-sm text-mm-muted">JPG, PNG or WebP</span>
        </button>
      ) : phase.kind === 'scanning' ? (
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-mm-bg2">
          <img src={phase.preview} alt="Receipt being read" className="w-full h-full object-cover opacity-70" />
          <motion.div className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-mm-accent/35 to-transparent"
            animate={{ top: ['-20%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }} />
          <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-mm-elevated to-transparent flex items-center gap-2 text-sm font-semibold text-mm-text" role="status">
            <ScanLine size={17} className="text-mm-accent" /> Reading receipt…
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {phase.preview && <img src={phase.preview} alt="" className="w-full max-h-48 object-cover rounded-2xl opacity-70" />}
          <div className="flex gap-2.5 p-3.5 rounded-xl bg-mm-negative/10 text-sm text-mm-text" role="alert">
            <CircleAlert size={18} className="text-mm-negative shrink-0 mt-0.5" /><span>{phase.message}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={ImageUp} className="flex-1" onClick={() => inputRef.current?.click()}>Try another</Button>
            <Button className="flex-1" onClick={manual}>Enter manually</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
