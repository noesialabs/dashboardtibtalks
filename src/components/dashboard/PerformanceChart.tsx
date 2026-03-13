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
import {
  format,
  subDays,
  startOfDay,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  differenceInDays,
  parseISO,
} from 'date-fns';
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
  customDateRange?: { from: string; to: string } | null;
}

function getMetricValue(post: PostWithMetrics, metric: MetricKey): number {
  if (metric === 'engagement') return post.metrics.engagementRate;
  return post.metrics[metric];
}

function buildChartData(
  posts: PostWithMetrics[],
  selectedPlatform: Platform | 'ALL',
  selectedPeriod: Period,
  metric: MetricKey,
  customDateRange?: { from: string; to: string } | null
) {
  const platforms: Platform[] =
    selectedPlatform === 'ALL'
      ? ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN']
      : [selectedPlatform];

  const metricDef = METRICS.find((m) => m.key === metric)!;
  const now = startOfDay(new Date());

  // Determine the date range
  let startDate: Date;
  let endDate: Date = now;

  if (selectedPeriod === 'custom' && customDateRange) {
    startDate = startOfDay(parseISO(customDateRange.from));
    endDate = startOfDay(parseISO(customDateRange.to));
  } else if (selectedPeriod === 'all') {
    // Derive from actual data
    if (posts.length === 0) {
      startDate = subDays(now, 60);
    } else {
      const dates = posts.map((p) => new Date(p.publishedAt).getTime());
      startDate = startOfDay(new Date(Math.min(...dates)));
    }
  } else {
    const days = selectedPeriod === '7d' ? 7
      : selectedPeriod === '30d' ? 30
      : selectedPeriod === '90d' ? 90
      : selectedPeriod === '1y' ? 365
      : 60;
    startDate = subDays(now, days);
  }

  const totalDays = differenceInDays(endDate, startDate);

  // Choose bucket granularity based on span
  type Bucket = { date: Date; label: string };
  let buckets: Bucket[];
  let matchFn: (postDate: Date, bucketDate: Date) => boolean;

  if (totalDays <= 45) {
    // Daily
    buckets = eachDayOfInterval({ start: startDate, end: endDate }).map((d) => ({
      date: d,
      label: format(d, 'dd MMM', { locale: fr }),
    }));
    matchFn = isSameDay;
  } else if (totalDays <= 180) {
    // Weekly
    buckets = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 }).map((d) => ({
      date: d,
      label: format(d, 'dd/MM', { locale: fr }),
    }));
    matchFn = (postDate, bucketDate) => isSameWeek(postDate, bucketDate, { weekStartsOn: 1 });
  } else {
    // Monthly
    buckets = eachMonthOfInterval({ start: startDate, end: endDate }).map((d) => ({
      date: d,
      label: format(d, 'MMM yy', { locale: fr }),
    }));
    matchFn = isSameMonth;
  }

  const data: Record<string, unknown>[] = buckets.map((bucket) => {
    const entry: Record<string, number | string> = { date: bucket.label };

    for (const platform of platforms) {
      const bucketPosts = posts.filter(
        (p) => p.platform === platform && matchFn(new Date(p.publishedAt), bucket.date)
      );

      if (bucketPosts.length === 0) {
        entry[platform] = 0;
      } else if (metricDef.aggregate === 'sum') {
        entry[platform] = bucketPosts.reduce((sum, p) => sum + getMetricValue(p, metric), 0);
      } else {
        const avg = bucketPosts.reduce((sum, p) => sum + getMetricValue(p, metric), 0) / bucketPosts.length;
        entry[platform] = Math.round(avg * 100) / 100;
      }
    }

    return entry;
  });

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
  customDateRange,
  height,
  metric,
}: Props & { height: string; metric: MetricKey }) {
  const { data, platforms } = useMemo(
    () => buildChartData(posts, selectedPlatform, selectedPeriod, metric, customDateRange),
    [posts, selectedPlatform, selectedPeriod, metric, customDateRange]
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

export function PerformanceChart({ posts, selectedPlatform, selectedPeriod, customDateRange }: Props) {
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
              customDateRange={customDateRange}
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
          customDateRange={customDateRange}
          height="16rem"
          metric={metric}
        />
      </div>
    </ExpandableChart>
  );
}
