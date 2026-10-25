import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const goalImgMap: Record<string, string> = {
  'New iPhone': '/assets/moneymate/goals/iphone.jpg',
  'Europe Trip': '/assets/moneymate/goals/europe-trip.jpg',
  'Emergency Fund': '/assets/moneymate/goals/emergency-fund.jpg',
  'New Car': '/assets/moneymate/goals/new-car.jpg',
  'Dream House': '/assets/moneymate/goals/dream-house.jpg',
  'Education': '/assets/moneymate/goals/education.jpg',
  'Bike': '/assets/moneymate/goals/bike.jpg',
  'Laptop': '/assets/moneymate/goals/laptop.jpg',
  'Camera': '/assets/moneymate/goals/camera.jpg',
  'Gaming Setup': '/assets/moneymate/goals/gaming-setup.jpg',
  'Travel World': '/assets/moneymate/goals/travel-world.jpg',
};

export const SavingsGoalsPreview: React.FC = () => {
  const { goals } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-mm-text">
            Savings goals
          </h3>
          <p className="text-xs text-mm-text2 mt-0.5">Progress towards what you’re saving for</p>
        </div>
        <button 
          onClick={() => navigate('/goals')}
          className="text-xs text-mm-gold font-medium hover:text-mm-gold-light transition-colors"
        >
          All Goals ({goals.length}) →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {goals.slice(0, 4).map((goal) => {
          const progress = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
          const imageSrc = goal.image || goalImgMap[goal.name];

          return (
            <div
              key={goal.id}
              className="glass-card overflow-hidden cursor-pointer group flex flex-col justify-between"
              onClick={() => navigate('/goals')}
            >
              {/* Image banner with dark editorial overlay */}
              {imageSrc && (
                <div className="relative h-28 w-full overflow-hidden bg-mm-bg2">
                  <img
                    src={imageSrc}
                    alt={goal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-mm-card via-mm-card/60 to-transparent" />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-mm-bg/80 backdrop-blur-sm border border-mm-line/16 text-[10px] font-mono text-mm-gold">
                    {progress}%
                  </div>
                </div>
              )}

              {/* Goal metadata */}
              <div className="p-4 pt-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-sm font-semibold text-mm-text truncate tracking-tight">{goal.name}</h4>
                    <ArrowUpRight size={13} className="text-mm-muted group-hover:text-mm-gold transition-colors" />
                  </div>
                  <p className="text-xs text-mm-muted mt-0.5 number-display">
                    Target: {formatCurrency(goal.targetAmount)}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-mm-line/8">
                  <div className="flex items-center justify-between text-[11px] text-mm-text2 mb-1.5 number-display">
                    <span>{formatCurrency(goal.savedAmount)} saved</span>
                    <span className="text-mm-muted">{formatCurrency(Math.max(0, goal.targetAmount - goal.savedAmount))} left</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill bg-mm-gold"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
