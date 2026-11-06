import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Same markup and CSS as the splash in index.html, so the hand-off is seamless. */
export const BootSplash: React.FC<{ label?: string }> = ({ label = 'Loading MoneyMate' }) => (
  <div className="mm-boot" role="status" aria-label={label}>
    <div className="mm-boot-stage">
      <div className="mm-boot-coin">
        {[-3, -2, -1, 0, 1, 2, 3].map(z => <i key={z} style={{ transform: `translateZ(${z}px)` }} />)}
        <span className="mm-boot-face front">₹</span>
        <span className="mm-boot-face back">₹</span>
      </div>
      <span className="mm-boot-shadow" />
    </div>
    <span className="mm-boot-word font-display">MoneyMate</span>
    <span className="mm-boot-bar" />
  </div>
);

/** One shimmering block. */
export const Bone: React.FC<{ className?: string; style?: React.CSSProperties; dark?: boolean }> = ({ className, style, dark }) => (
  <span className={cn('sk block', dark && 'sk-dark', className)} style={style} />
);

const Row: React.FC = () => (
  <div className="flex items-center gap-3 py-3">
    <Bone className="w-10 h-10 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2"><Bone className="h-3.5 w-2/5 rounded-md" /><Bone className="h-3 w-3/5 rounded-md" /></div>
    <Bone className="h-4 w-16 rounded-md" />
  </div>
);

const Header: React.FC<{ wide?: boolean }> = ({ wide }) => (
  <div className="mb-6 space-y-2.5"><Bone className={cn('h-9 rounded-xl', wide ? 'w-64' : 'w-48')} /><Bone className="h-4 w-72 max-w-full rounded-lg" /></div>
);

function DashboardSkeleton() {
  return (
    <>
      <div className="mb-6 space-y-2"><Bone className="h-4 w-32 rounded-md" /><Bone className="h-9 w-64 max-w-full rounded-xl" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
        <div className="note-panel p-6 h-[260px] flex flex-col">
          <Bone dark className="h-4 w-36 rounded-md" />
          <Bone dark className="h-14 w-52 rounded-xl mt-4" />
          <Bone dark className="h-3 w-24 rounded-md mt-3" />
          <Bone dark className="h-2.5 w-full rounded-full mt-auto" />
        </div>
        <div className="lg:hidden grid grid-cols-4 gap-3 py-1">
          {[0, 1, 2, 3].map(i => <div key={i} className="flex flex-col items-center gap-2"><Bone className="w-14 h-14 rounded-full" /><Bone className="h-3 w-12 rounded" /></div>)}
        </div>
        <div className="panel p-5 space-y-4">{[0, 1, 2].map(i => <div key={i} className="flex justify-between"><Bone className="h-4 w-24 rounded-md" /><Bone className="h-5 w-20 rounded-md" /></div>)}</div>
      </div>
      <div className="panel p-5 mt-4">{[0, 1, 2, 3].map(i => <Row key={i} />)}</div>
    </>
  );
}

function ListSkeleton() {
  return (
    <>
      <Header />
      <Bone className="h-11 w-full rounded-xl mb-3" />
      <div className="flex gap-2 mb-5 overflow-hidden">{[56, 48, 40, 96, 88, 72].map((w, i) => <Bone key={i} className="h-8 rounded-full shrink-0" style={{ width: w }} />)}</div>
      <div className="panel px-5 py-2">{Array.from({ length: 7 }, (_, i) => <Row key={i} />)}</div>
    </>
  );
}

function CardsSkeleton({ photos }: { photos?: boolean }) {
  return (
    <>
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="panel overflow-hidden">
            {photos && <Bone className="h-36 w-full rounded-none" />}
            <div className="p-5 space-y-3"><Bone className="h-5 w-1/2 rounded-md" /><Bone className="h-7 w-2/5 rounded-lg" /><Bone className="h-2 w-full rounded-full" /></div>
          </div>
        ))}
      </div>
    </>
  );
}

/** A placeholder shaped like the page that's loading. */
export const RouteSkeleton: React.FC<{ pathname: string }> = ({ pathname }) => {
  const body = pathname === '/' ? <DashboardSkeleton />
    : /^\/(transactions|friends|groups|import)/.test(pathname) ? <ListSkeleton />
    : pathname.startsWith('/goals') ? <CardsSkeleton photos />
    : <CardsSkeleton />;
  return (
    <div role="status" aria-label="Loading">
      <motion.div className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left bg-[linear-gradient(90deg,var(--color-mm-accent),var(--color-mm-marigold))]"
        initial={{ scaleX: 0 }} animate={{ scaleX: 0.9 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10 pt-5 sm:pt-8" aria-hidden>{body}</div>
    </div>
  );
};
