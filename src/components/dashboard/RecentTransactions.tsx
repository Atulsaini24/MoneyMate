import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { AddTransactionSheet } from '@/components/transactions/AddTransactionSheet';
import { Button, EmptyState, LinkButton, SectionTitle } from '@/components/ui';
import type { Transaction } from '@/types';

export const RecentTransactions: React.FC = () => {
  const { transactions } = useApp();
  const { openAddSheet } = useUI();
  const navigate = useNavigate();
  const [edit, setEdit] = useState<Transaction | null>(null);
  const recent = [...transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date) || +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);
  return (
    <section className="panel p-5 sm:p-6 h-full" aria-labelledby="recent-title">
      <SectionTitle id="recent-title" title="Recent activity" action={transactions.length ? <LinkButton onClick={() => navigate('/transactions')}>See all</LinkButton> : undefined} />
      {recent.length === 0 ? (
        <EmptyState compact icon={ArrowLeftRight} title="Nothing recorded yet" description="Add what you spend and earn, or import bank SMS to catch up in one go."
          action={<><Button onClick={() => openAddSheet({ type: 'expense' })}>Add expense</Button><Button variant="secondary" onClick={() => navigate('/import')}>Import SMS</Button></>} />
      ) : (
        <div className="divide-hairline">
          {recent.map((t, i) => <TransactionRow key={t.id} tx={t} showDate index={i} onClick={() => setEdit(t)} />)}
        </div>
      )}
      {edit && <AddTransactionSheet key={edit.id} isOpen onClose={() => setEdit(null)} editTransaction={edit} />}
    </section>
  );
};
