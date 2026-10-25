import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, X, ScanLine, AlertCircle, ImageUp } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import { cloud } from '@/lib/api';

type Phase = { kind: 'pick' } | { kind: 'scanning'; preview: string } | { kind: 'error'; message: string; preview?: string };

export const ReceiptScanner: React.FC = () => {
  const { scannerOpen, setScannerOpen, openAddSheet } = useUI();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scannerOpen) setPhase({ kind: 'pick' });
  }, [scannerOpen]);

  const close = () => setScannerOpen(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (!user) {
      setPhase({ kind: 'error', preview, message: 'Sign in to scan receipts. Scanning runs on the server so it needs your account.' });
      return;
    }
    setPhase({ kind: 'scanning', preview });
    try {
      const r = await cloud.scanReceipt(file);
      const itemNote = r.items.length ? r.items.map(i => `${i.name} ${i.amount}`).join(', ') : '';
      close();
      openAddSheet({
        prefill: {
          type: 'expense',
          amount: r.amount,
          description: r.merchant,
          category: r.category,
          date: r.date || undefined,
          paymentMethod: r.paymentMethod || undefined,
          notes: itemNote ? `Scanned: ${itemNote}`.slice(0, 280) : 'Scanned from receipt',
        },
      });
    } catch (e: any) {
      setPhase({ kind: 'error', preview, message: e?.message || 'Receipt could not be read.' });
    }
  };

  return createPortal(
    <AnimatePresence>
      {scannerOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Scan a receipt">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overlay-bg absolute inset-0" onClick={close} />
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            className="relative w-full sm:max-w-md glass-card-elevated rounded-b-none sm:rounded-[22px] p-5 pb-8 sm:pb-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-mm-text">Scan a receipt</h2>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-mm-text/5 text-mm-muted" aria-label="Close"><X size={18} /></button>
            </div>

            <input
              ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
            />

            {phase.kind === 'pick' && (
              <>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-2xl border border-dashed border-mm-line/35 bg-mm-bg2 flex flex-col items-center justify-center gap-3 text-mm-text2 hover:border-mm-gold/60 hover:text-mm-text transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-mm-gold/12 text-mm-gold flex items-center justify-center">
                    <Camera size={26} strokeWidth={1.6} />
                  </div>
                  <span className="text-sm font-medium">Take a photo or choose one</span>
                  <span className="text-xs text-mm-muted max-w-[16rem] text-center leading-relaxed">
                    MoneyMate reads the total, shop, date and category, then lets you check before saving.
                  </span>
                </button>
              </>
            )}

            {phase.kind === 'scanning' && (
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-mm-bg2">
                <img src={phase.preview} alt="Receipt being scanned" className="w-full h-full object-cover opacity-70" />
                <motion.div
                  className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-mm-gold/40 to-transparent"
                  animate={{ top: ['-15%', '100%'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-mm-bg to-transparent flex items-center gap-2 text-sm text-mm-text">
                  <ScanLine size={16} className="text-mm-gold" /> Reading receipt…
                </div>
              </div>
            )}

            {phase.kind === 'error' && (
              <div className="space-y-4">
                {phase.preview && <img src={phase.preview} alt="" className="w-full max-h-48 object-cover rounded-2xl opacity-60" />}
                <div className="flex gap-2.5 p-3 rounded-xl bg-mm-negative/10 border border-mm-negative/25 text-sm text-mm-text">
                  <AlertCircle size={17} className="text-mm-negative shrink-0 mt-0.5" />
                  <span>{phase.message}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => inputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-mm-line/25 text-sm text-mm-text hover:bg-mm-text/5">
                    <ImageUp size={15} /> Try another photo
                  </button>
                  <button onClick={() => { close(); openAddSheet({ type: 'expense' }); }} className="flex-1 py-2.5 rounded-xl bg-mm-gold text-mm-on-gold text-sm font-semibold hover:bg-mm-gold-light">
                    Enter manually
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
