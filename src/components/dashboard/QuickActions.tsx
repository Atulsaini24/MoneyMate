import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowDownLeft, ArrowDownUp, Receipt, ShieldCheck } from 'lucide-react';
import { AddTransactionSheet } from '@/components/transactions/AddTransactionSheet';

export const QuickActions: React.FC = () => {
  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [showScanProto, setShowScanProto] = useState(false);

  const actions = [
    { label: 'Add Expense', icon: Plus, type: 'expense' as const, isPrimary: true },
    { label: 'Add Income', icon: ArrowDownLeft, type: 'income' as const, isPrimary: false },
    { label: 'Transfer', icon: ArrowDownUp, type: 'transfer' as const, isPrimary: false },
    { label: 'Scan Receipt', icon: Receipt, type: 'scan' as const, isPrimary: false },
  ];

  const handleAction = (actionType: string) => {
    if (actionType === 'scan') {
      setShowScanProto(true);
      return;
    }
    setSheetType(actionType as 'expense' | 'income' | 'transfer');
    setShowSheet(true);
  };

  return (
    <>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77736D]">
            Quick Operations
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {actions.map(action => (
            <button
              key={action.label}
              onClick={() => handleAction(action.type)}
              className={`flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border transition-all duration-150 text-left active:scale-[0.98] min-w-0 ${
                action.isPrimary
                  ? 'bg-[#17171B] border-[rgba(214,188,134,0.3)] hover:border-[#D6BC86] text-[#F5F1E8] shadow-sm'
                  : 'bg-[#121215] border-[rgba(214,188,134,0.1)] hover:border-[rgba(214,188,134,0.22)] text-[#B6B0A5] hover:text-[#F5F1E8]'
              }`}
            >
              <div className={`p-2 rounded-lg flex items-center justify-center flex-shrink-0 ${
                action.isPrimary 
                  ? 'bg-[#D6BC86]/15 text-[#D6BC86]' 
                  : 'bg-[#17171B] text-[#B6B0A5]'
              }`}>
                <action.icon size={16} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold tracking-tight leading-tight truncate">{action.label}</span>
                <span className="text-[10px] text-[#77736D] leading-tight mt-0.5 truncate">
                  {action.type === 'expense' ? 'Record outflow' : action.type === 'income' ? 'Record inflow' : action.type === 'transfer' ? 'Internal move' : 'Smart OCR'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <AddTransactionSheet isOpen={showSheet} onClose={() => setShowSheet(false)} defaultType={sheetType} />

      {/* Scan Receipt Dialog */}
      {showScanProto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="overlay-bg absolute inset-0" onClick={() => setShowScanProto(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card-elevated p-6 max-w-sm w-full relative z-10 text-center border border-[rgba(214,188,134,0.2)]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#17171B] border border-[rgba(214,188,134,0.2)] flex items-center justify-center mx-auto mb-3 text-[#D6BC86]">
              <Receipt size={22} strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-semibold text-[#F5F1E8] mb-1.5">Smart Receipt Scanner</h3>
            <p className="text-xs text-[#B6B0A5] mb-5 leading-relaxed">
              Optical character recognition classifies line-items and taxes automatically into your private ledger.
            </p>
            <button
              onClick={() => setShowScanProto(false)}
              className="w-full py-2.5 rounded-xl bg-[#D6BC86] text-[#0B0B0D] font-semibold text-xs tracking-wider uppercase hover:bg-[#E9D8AF] transition-colors"
            >
              Understood
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};
