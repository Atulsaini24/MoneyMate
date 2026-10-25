import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface BalanceCardProps {
  balance: number;
  change: number;
  chartData: { value: number }[];
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance, change, chartData }) => {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-elevated p-4 sm:p-6 relative overflow-hidden group specular-sheen"
    >
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-mm-text2">
              Total balance
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-mm-bg2 border border-mm-line/12 text-mm-gold">
            <ArrowUpRight size={14} strokeWidth={1.75} />
          </div>
        </div>

        {/* Amount & Trend row */}
        <div className="flex items-end justify-between gap-2 mt-1">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-mm-text number-display tracking-tight whitespace-nowrap">
              <AnimatedNumber value={balance} />
            </h2>
            
            {/* Metric pill */}
            <div className="inline-flex items-center gap-1.5 mt-2 px-2 sm:px-2.5 py-0.5 rounded-md bg-mm-bg2 border border-mm-line/12">
              <div className={`flex items-center gap-1 ${isPositive ? 'text-mm-positive' : 'text-mm-negative'}`}>
                {isPositive ? <TrendingUp size={11} strokeWidth={1.75} /> : <TrendingDown size={11} strokeWidth={1.75} />}
                <span className="text-[11px] sm:text-xs font-semibold">{isPositive ? '+' : ''}{change}%</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-mm-muted whitespace-nowrap">in 30 days</span>
            </div>
          </div>

          {/* Sparkline in Champagne Gold */}
          <div className="w-20 h-11 sm:w-24 sm:h-12 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={change >= 0 ? "#83C9A5" : "#E08C8C"}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
