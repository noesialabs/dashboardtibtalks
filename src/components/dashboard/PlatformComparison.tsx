'use client';

import type { PlatformStats, Platform } from '@/types/social';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/types/social';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  stats: PlatformStats[];
}

export function PlatformComparison({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 h-full flex items-center justify-center">
        <p className="text-white/30 text-sm">Aucune donnée</p>
      </div>
    );
  }

  // Normalize to 0-100
  const maxViews = Math.max(...stats.map((s) => s.totalViews), 1);
  const maxLikes = Math.max(...stats.map((s) => s.totalLikes), 1);
  const maxPosts = Math.max(...stats.map((s) => s.totalPosts), 1);
  const maxEng = Math.max(...stats.map((s) => s.avgEngagement), 1);

  const radarData = [
    { metric: 'Vues', ...Object.fromEntries(stats.map((s) => [s.platform, Math.round((s.totalViews / maxViews) * 100)])) },
    { metric: 'Likes', ...Object.fromEntries(stats.map((s) => [s.platform, Math.round((s.totalLikes / maxLikes) * 100)])) },
    { metric: 'Posts', ...Object.fromEntries(stats.map((s) => [s.platform, Math.round((s.totalPosts / maxPosts) * 100)])) },
    { metric: 'Engagement', ...Object.fromEntries(stats.map((s) => [s.platform, Math.round((s.avgEngagement / maxEng) * 100)])) },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 h-full">
      <h3 className="text-white font-semibold mb-2">Comparaison Plateformes</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            />
            {stats.map((s) => (
              <Radar
                key={s.platform}
                name={PLATFORM_NAMES[s.platform as Platform]}
                dataKey={s.platform}
                stroke={PLATFORM_COLORS[s.platform as Platform]}
                fill={PLATFORM_COLORS[s.platform as Platform]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
            <Legend
              formatter={(value: string) => (
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{value}</span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
