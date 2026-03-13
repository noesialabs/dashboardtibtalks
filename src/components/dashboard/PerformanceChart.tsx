'use client';

import { useMemo } from 'react';
import type { PostWithMetrics, Platform } from '@/types/social';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/types/social';
import type { Period } from '@/stores/dashboardStore';
import { ExpandableChart } from './ExpandableChart';
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
  selectedPeriod: Period;
}

function buildChartData(posts: PostWithMetrics[], selectedPlatform: Platform | 'ALL', selectedPeriod: Period) {
  const days = selectedPeriod === '7d' ? 7
    : selectedPeriod === '30d' ? 30
    : selectedPeriod === '90d' ? 90
    : selectedPeriod === '1y' ? 365
    : 60;

  const data: Record<string, unknown>[] = [];
  const platforms: Platform[] =
    selectedPlatform === 'ALL'
      ? ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN']
      : [selectedPlatform];

  for (let i = days; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const dayLabel = days <= 30
      ? format(day, 'dd MMM', { locale: fr })
      : days <= 90
        ? format(day, 'dd/MM', { locale: fr })
        : format(day, 'MMM yy', { locale: fr });

    const entry: Record<string, number | string> = { date: dayLabel };

    for (const platform of platforms) {
      const dayPosts = posts.filter(
        (p) => p.platform === platform && isSameDay(new Date(p.publishedAt), day)
      );
      const avgEng = dayPosts.length > 0
        ? dayPosts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / dayPosts.length
        : 0;
      entry[platform] = Math.round(avgEng * 100) / 100;
    }

    data.push(entry);
  }
  return { data, platforms };
}

function ChartContent({ posts, selectedPlatform, selectedPeriod, height }: Props & { height: string }) {
  const { data, platforms } = useMemo(
    () => buildChartData(posts, selectedPlatform, selectedPeriod),
    [posts, selectedPlatform, selectedPeriod]
  );

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
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
  );
}

export function PerformanceChart({ posts, selectedPlatform, selectedPeriod }: Props) {
  return (
    <ExpandableChart
      title="Performance (engagement %)"
      expandedContent={<ChartContent posts={posts} selectedPlatform={selectedPlatform} selectedPeriod={selectedPeriod} height="100%" />}
    >
      <ChartContent posts={posts} selectedPlatform={selectedPlatform} selectedPeriod={selectedPeriod} height="18rem" />
    </ExpandableChart>
  );
}
