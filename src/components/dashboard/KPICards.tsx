'use client';

import type { KPIData } from '@/types/social';
import { Eye, Heart, MessageCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const icons = [Eye, Heart, MessageCircle, TrendingUp];
const gradients = [
  'from-violet-500/20 to-violet-500/5',
  'from-pink-500/20 to-pink-500/5',
  'from-blue-500/20 to-blue-500/5',
  'from-emerald-500/20 to-emerald-500/5',
];
const iconColors = ['text-violet-400', 'text-pink-400', 'text-blue-400', 'text-emerald-400'];
const lineColors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'];

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(n < 10 ? 1 : 0);
}

interface Props {
  kpis: KPIData[];
  isLoading: boolean;
}

export function KPICards({ kpis, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => {
        const Icon = icons[i % icons.length];
        const sparkData = kpi.sparkline.map((v, idx) => ({ v, idx }));
        const isPositive = kpi.changePercent >= 0;

        return (
          <div
            key={kpi.label}
            className="glass-card rounded-2xl p-5 hover:scale-[1.02] hover:glow-violet transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColors[i % iconColors.length]}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                <span>{isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(kpi.changePercent).toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/40 text-xs mb-1">{kpi.label}</p>
                <p className="text-white text-2xl font-bold">{formatCompact(kpi.value)}</p>
              </div>
              <div className="w-20 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={lineColors[i % lineColors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
