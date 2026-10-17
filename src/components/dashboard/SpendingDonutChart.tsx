import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SpendingDonutChartProps {
  data: { name: string; value: number }[];
  total: number;
}

// Quiet Luxury Chart Palette: Restrained Gold & Muted Editorial Neutrals
const LUXURY_SERIES_COLORS = [
  '#D6BC86', // Champagne Gold (Primary)
  '#E9D8AF', // Soft Gold Highlight
  '#B6B0A5', // Warm Silver / Secondary
  '#8E8A83', // Muted Taupe
  '#64605A', // Deep Graphite
  '#83C9A5', // Restrained Sage
  '#D9B46F', // Muted Amber
  '#D98282', // Muted Rose
  '#4A4742', // Dark Slate
];

export const SpendingDonutChart: React.FC<SpendingDonutChartProps> = ({ data, total }) => {
  const navigate = useNavigate();
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77736D]">
            Expenditure Distribution
          </h3>
          <p className="text-xs text-[#B6B0A5] mt-0.5">Capital outflows by classification</p>
        </div>
        <button 
          onClick={() => navigate('/reports')}
          className="text-xs text-[#D6BC86] font-medium hover:text-[#E9D8AF] transition-colors"
        >
          View Analysis →
        </button>
      </div>

      {sortedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 my-auto text-center">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#222228] flex items-center justify-center text-[#77736D] mb-3">
            <span className="text-xs font-mono">0%</span>
          </div>
          <p className="text-xs font-medium text-[#B6B0A5]">No outflows recorded this month</p>
          <p className="text-[11px] text-[#77736D] mt-0.5">Add an expense to visualize category distributions</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
          {/* Donut Chart */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sortedData}
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#17171B"
                  strokeWidth={2}
                >
                  {sortedData.map((_, i) => (
                    <Cell key={i} fill={LUXURY_SERIES_COLORS[i % LUXURY_SERIES_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-[#77736D] uppercase tracking-wider font-semibold">Total Spent</span>
              <p className="text-lg font-bold text-[#F5F1E8] number-display tracking-tight">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

        {/* Analytical Legend */}
        <div className="flex-1 space-y-2 w-full">
          {sortedData.slice(0, 5).map((item, i) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: LUXURY_SERIES_COLORS[i % LUXURY_SERIES_COLORS.length] }}
                  />
                  <span className="text-[#B6B0A5] truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#77736D] text-[11px] font-mono">{percentage}%</span>
                  <span className="font-semibold text-[#F5F1E8] number-display w-16 text-right">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
};
