'use client';

import { useMemo } from 'react';
import type { PostWithMetrics, Platform } from '@/types/social';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/types/social';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  posts: PostWithMetrics[];
  selectedPlatform: Platform | 'ALL';
}

export function PerformanceChart({ posts, selectedPlatform }: Props) {
  const chartData = useMemo(() => {
    const days = 60;
    const data: Record<string, Record<string, number>>[] = [];

    for (let i = days; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayLabel = format(day, 'dd MMM', { locale: fr });
      const entry: Record<string, number> = {};

      const platforms: Platform[] =
        selectedPlatform === 'ALL'
          ? ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN']
          : [selectedPlatform];

      for (const platform of platforms) {
        const dayPosts = posts.filter(
          (p) =>
            p.platform === platform &&
            isSameDay(new Date(p.publishedAt), day)
        );
        const avgEng = dayPosts.length > 0
          ? dayPosts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / dayPosts.length
          : 0;
        entry[platform] = Math.round(avgEng * 100) / 100;
      }

      data.push({ date: dayLabel, ...entry } as unknown as Record<string, Record<string, number>>);
    }
    return data;
  }, [posts, selectedPlatform]);

  const platforms: Platform[] =
    selectedPlatform === 'ALL'
      ? ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN']
      : [selectedPlatform];

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Performance (engagement %)</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              {platforms.map((p) => (
                <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PLATFORM_COLORS[p]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={PLATFORM_COLORS[p]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#12121A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
              }}
            />
            <Legend
              formatter={(value: string) => (
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  {PLATFORM_NAMES[value as Platform] ?? value}
                </span>
              )}
            />
            {platforms.map((p) => (
              <Area
                key={p}
                type="monotone"
                dataKey={p}
                stroke={PLATFORM_COLORS[p]}
                fill={`url(#grad-${p})`}
                strokeWidth={2}
                dot={false}
                name={p}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
