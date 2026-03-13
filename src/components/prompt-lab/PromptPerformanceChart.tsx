'use client';

import type { PromptDNAData } from '@/types/social';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface Props {
  versions: PromptDNAData[];
}

export function PromptPerformanceChart({ versions }: Props) {
  const sorted = [...versions].sort((a, b) => a.version - b.version);

  const data = sorted.map((v) => {
    const perf = v.performances?.[0];
    return {
      name: `v${v.version}`,
      engagement: perf?.avgEngagementRate ?? 0,
      views: perf?.avgViews ?? 0,
      posts: perf?.postsGenerated ?? 0,
      status: v.status,
    };
  });

  const avgEngagement = data.length > 0
    ? data.reduce((sum, d) => sum + d.engagement, 0) / data.length
    : 0;

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-4">Performance par version</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#12121A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
              }}
              formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Engagement']}
            />
            <ReferenceLine
              y={avgEngagement}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="3 3"
              label={{ value: 'Moyenne', fill: 'rgba(255,255,255,0.3)', fontSize: 10, position: 'right' }}
            />
            <Bar dataKey="engagement" radius={[6, 6, 0, 0]} maxBarSize={50}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.status === 'ACTIVE' ? 'url(#barGradient)' :
                    entry.status === 'TESTING' ? '#EAB308' :
                    entry.status === 'ROLLED_BACK' ? '#EF4444' :
                    'rgba(255,255,255,0.15)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
