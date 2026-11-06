import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Target } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { goalLook } from '@/lib/goals';
import { goalPhoto } from '@/lib/photos';
import { Photo } from '@/components/shared/Photo';
import { Button, EmptyState, LinkButton, SectionTitle } from '@/components/ui';

/** Goals as a row of photo cards you swipe through. */
export const SavingsGoalsPreview: React.FC = () => {
  const { goals } = useApp();
  const navigate = useNavigate();
  const open = [...goals].sort((a, b) => Number(a.savedAmount >= a.targetAmount) - Number(b.savedAmount >= b.targetAmount));
  return (
    <section className="panel p-5 sm:p-6 h-full flex flex-col overflow-hidden" aria-labelledby="goals-title">
      <SectionTitle id="goals-title" title="Goals" subtitle={goals.length ? `${goals.length} goal${goals.length === 1 ? '' : 's'}` : undefined}
        action={goals.length ? <LinkButton onClick={() => navigate('/goals')}>All goals</LinkButton> : undefined} />
      {goals.length === 0 ? (
        <EmptyState compact icon={Target} title="Save towards something" description="A trip, a phone, an emergency fund. Goals show how far you’ve got."
          action={<Button variant="secondary" onClick={() => navigate('/goals')}>Create a goal</Button>} />
      ) : (
        <ul className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-px-5 sm:scroll-px-6 -mx-5 px-5 sm:-mx-6 sm:px-6 pb-1 pt-1">
          {open.slice(0, 6).map((g, i) => {
            const look = goalLook(g);
            const pct = g.targetAmount > 0 ? Math.min(100, (g.savedAmount / g.targetAmount) * 100) : 0;
            return (
              <motion.li key={g.id} className="snap-start shrink-0 w-[78%] sm:w-[260px]"
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 28 }}>
                <button onClick={() => navigate('/goals')} className="block w-full text-left rounded-[20px] overflow-hidden active:scale-[0.98] transition-transform">
                  <Photo src={goalPhoto(g.name, look.icon, 600)} color={look.color} icon={look.icon} className="h-44 rounded-[20px]">
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgb(0_0_0/0.72))]" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <p className="text-[16px] font-semibold truncate">{g.name}</p>
                      <p className="text-[13px] text-white/80 tabular mt-0.5"><b className="font-semibold text-white">{formatCurrency(g.savedAmount)}</b> of {formatCurrency(g.targetAmount)}</p>
                      <div className="mt-2.5 h-1.5 rounded-full bg-white/25 overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.name} progress`}>
                        <motion.div className="h-full rounded-full bg-[var(--color-mm-marigold)]" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }} />
                      </div>
                    </div>
                  </Photo>
                </button>
              </motion.li>
            );
          })}
          <li className="snap-start shrink-0 w-[44%] sm:w-[160px]">
            <button onClick={() => navigate('/goals')} className="w-full h-44 rounded-[20px] border-2 border-dashed border-mm-line/15 flex flex-col items-center justify-center gap-2 text-mm-text2 hover:border-mm-accent/50 hover:text-mm-accent transition-colors">
              <span className="w-11 h-11 rounded-full bg-mm-accent/10 text-mm-accent flex items-center justify-center"><Plus size={20} /></span>
              <span className="text-[13px] font-semibold">New goal</span>
            </button>
          </li>
        </ul>
      )}
    </section>
  );
};
