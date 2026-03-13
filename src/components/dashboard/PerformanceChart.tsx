'use client';

import { useMemo, useState } from 'react';
import type { PostWithMetrics, Platform } from '@/types/social';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/types/social';
import type { Period } from '@/stores/dashboardStore';
import { ExpandableChart } from './ExpandableChart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';

type MetricKey = 'views' | 'likes' | 'comments' | 'shares' | 'engagement';

const METRICS: { key: MetricKey; label: string; icon: typeof Eye; unit: string; aggregate: 'sum' | 'avg' }[] = [
  { key: 'views', label: 'Vues', icon: Eye, unit: '', aggregate: 'sum' },
  { key: 'likes', label: 'Likes', icon: Heart, unit: '', aggregate: 'sum' },
  { key: 'comments', label: 'Commentaires', icon: MessageCircle, unit: '', aggregate: 'sum' },
  { key: 'shares', label: 'Partages', icon: Share2, unit: '', aggregate: 'sum' },
  { key: 'engagement', label: 'Engagement', icon: TrendingUp, unit: '%', aggregate: 'avg' },
];

interface Props {
  posts: PostWithMetrics[];
  selectedPlatform: Platform | 'ALL';
  selectedPeriod: Period;
}

function getMetricValue(post: PostWithMetrics, metric: MetricKey): number {
  if (metric === 'engagement') return post.metrics.engagementRate;
  return post.metrics[metric];
}

function buildChartData(
  posts: PostWithMetrics[],
  selectedPlatform: Platform | 'ALL',
  selectedPeriod: Period,
  metric: MetricKey
) {
  const days =
    selectedPeriod === '7d' ? 7
    : selectedPeriod === '30d' ? 30
    : selectedPeriod === '90d' ? 90
    : selectedPeriod === '1y' ? 365
    : 60;

  const data: Record<string, unknown>[] = [];
  const platforms: Platform[] =
    selectedPlatform === 'ALL'
      ? ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN']
      : [selectedPlatform];

  const metricDef = METRICS.find((m) => m.key === metric)!;

  for (let i = days; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const dayLabel =
      days <= 30
        ? format(day, 'dd MMM', { locale: fr })
        : days <= 90
          ? format(day, 'dd/MM', { locale: fr })
          : format(day, 'MMM yy', { locale: fr });

    const entry: Record<string, number | string> = { date: dayLabel };

    for (const platform of platforms) {
      const dayPosts = posts.filter(
        (p) => p.platform === platform && isSameDay(new Date(p.publishedAt), day)
      );

      if (dayPosts.length === 0) {
        entry[platform] = 0;
      } else if (metricDef.aggregate === 'sum') {
        entry[platform] = dayPosts.reduce((sum, p) => sum + getMetricValue(p, metric), 0);
      } else {
        const avg = dayPosts.reduce((sum, p) => sum + getMetricValue(p, metric), 0) / dayPosts.length;
        entry[platform] = Math.round(avg * 100) / 100;
      }
    }

    data.push(entry);
  }
  return { data, platforms };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

function MetricTabs({
  activeMetric,
  onSelect,
}: {
  activeMetric: MetricKey;
  onSelect: (m: MetricKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {METRICS.map((m) => {
        const Icon = m.icon;
        const active = activeMetric === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              active
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/10 border border-transparent'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

function ChartContent({
  posts,
  selectedPlatform,
  selectedPeriod,
  height,
  metric,
}: Props & { height: string; metric: MetricKey }) {
  const { data, platforms } = useMemo(
    () => buildChartData(posts, selectedPlatform, selectedPeriod, metric),
    [posts, selectedPlatform, selectedPeriod, metric]
  );

  const metricDef = METRICS.find((m) => m.key === metric)!;
  const useBarChart = metric !== 'engagement' && platforms.length <= 2;

  const tooltipFormatter = (value: number) => {
    if (metric === 'engagement') return `${value}%`;
    return formatNumber(value);
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {useBarChart ? (
          <BarChart data={data}>
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
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#12121A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
              }}
              formatter={(value) => [tooltipFormatter(Number(value)), metricDef.label]}
              labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            />
            <Legend
              formatter={(value: string) => (
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  {PLATFORM_NAMES[value as Platform] ?? value}
                </span>
              )}
            />
            {platforms.map((p) => (
              <Bar
                key={p}
                dataKey={p}
                fill={PLATFORM_COLORS[p]}
                opacity={0.8}
                radius={[4, 4, 0, 0]}
                name={p}
              />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              {platforms.map((p) => (
                <linearGradient key={p} id={`grad-${p}-${metric}`} x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(v) => metric === 'engagement' ? `${v}%` : formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#12121A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
              }}
              formatter={(value) => [tooltipFormatter(Number(value)), metricDef.label]}
              labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
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
                fill={`url(#grad-${p}-${metric})`}
                strokeWidth={2}
                dot={false}
                name={p}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function PerformanceChart({ posts, selectedPlatform, selectedPeriod }: Props) {
  const [metric, setMetric] = useState<MetricKey>('views');

  const metricDef = METRICS.find((m) => m.key === metric)!;
  const title = `Performance — ${metricDef.label}${metricDef.unit ? ` (${metricDef.unit})` : ''}`;

  return (
    <ExpandableChart
      title={title}
      expandedContent={
        <div className="flex flex-col h-full">
          <MetricTabs activeMetric={metric} onSelect={setMetric} />
          <div className="flex-1 mt-4">
            <ChartContent
              posts={posts}
              selectedPlatform={selectedPlatform}
              selectedPeriod={selectedPeriod}
              height="100%"
              metric={metric}
            />
          </div>
        </div>
      }
    >
      <MetricTabs activeMetric={metric} onSelect={setMetric} />
      <div className="mt-3">
        <ChartContent
          posts={posts}
          selectedPlatform={selectedPlatform}
          selectedPeriod={selectedPeriod}
          height="16rem"
          metric={metric}
        />
      </div>
    </ExpandableChart>
  );
}
