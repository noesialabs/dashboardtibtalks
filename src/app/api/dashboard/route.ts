import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { PostWithMetrics, KPIData, PlatformStats, HeatmapCell, AIInsightData, Platform } from '@/types/social';
import { PLATFORM_COLORS } from '@/types/social';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platformFilter = searchParams.get('platform') as Platform | null;
  const period = searchParams.get('period'); // 7d, 30d, 90d, 1y

  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  const where: Record<string, unknown> = {};
  if (platformFilter) where.platform = platformFilter;
  if (fromDate && toDate) {
    where.publishedAt = { gte: new Date(fromDate), lte: new Date(toDate + 'T23:59:59.999Z') };
  } else if (period) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '1y' ? 365 : 0;
    if (days > 0) {
      where.publishedAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }
  }

  // Fetch posts with latest metrics
  const dbPosts = await prisma.post.findMany({
    where,
    include: {
      metrics: { orderBy: { fetchedAt: 'desc' }, take: 1 },
    },
    orderBy: { publishedAt: 'desc' },
  });

  const posts: PostWithMetrics[] = dbPosts.map((p) => {
    const m = p.metrics[0];
    return {
      id: p.id,
      platformId: p.platformId,
      platform: p.platform as Platform,
      title: p.title,
      content: p.content,
      mediaType: p.mediaType as PostWithMetrics['mediaType'],
      mediaUrl: p.mediaUrl,
      thumbnailUrl: p.thumbnailUrl,
      publishedAt: p.publishedAt.toISOString(),
      url: p.url,
      transcript: p.transcript,
      metrics: {
        views: m?.views ?? 0,
        likes: m?.likes ?? 0,
        comments: m?.comments ?? 0,
        shares: m?.shares ?? 0,
        saves: m?.saves ?? 0,
        engagementRate: m?.engagementRate ?? 0,
      },
    };
  });

  // KPIs
  const totalViews = posts.reduce((s, p) => s + p.metrics.views, 0);
  const totalLikes = posts.reduce((s, p) => s + p.metrics.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.metrics.comments, 0);
  const avgEngagement = posts.length > 0
    ? posts.reduce((s, p) => s + p.metrics.engagementRate, 0) / posts.length
    : 0;

  // Sparklines — group posts by day for last 30 days
  function makeSparkline(getter: (p: PostWithMetrics) => number): number[] {
    const spark: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayPosts = posts.filter((p) => p.publishedAt.startsWith(dayStr));
      spark.push(dayPosts.reduce((s, p) => s + getter(p), 0));
    }
    return spark;
  }

  // Previous period values (rough calc)
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const currentPosts = posts.filter((p) => now - new Date(p.publishedAt).getTime() < thirtyDays);
  const prevPosts = posts.filter((p) => {
    const age = now - new Date(p.publishedAt).getTime();
    return age >= thirtyDays && age < thirtyDays * 2;
  });

  const prevViews = prevPosts.reduce((s, p) => s + p.metrics.views, 0) || 1;
  const prevLikes = prevPosts.reduce((s, p) => s + p.metrics.likes, 0) || 1;
  const prevComments = prevPosts.reduce((s, p) => s + p.metrics.comments, 0) || 1;
  const prevEngagement = prevPosts.length > 0
    ? prevPosts.reduce((s, p) => s + p.metrics.engagementRate, 0) / prevPosts.length
    : 1;

  const kpis: KPIData[] = [
    {
      label: 'Total Vues',
      value: totalViews,
      previousValue: prevViews,
      change: totalViews - prevViews,
      changePercent: ((totalViews - prevViews) / prevViews) * 100,
      sparkline: makeSparkline((p) => p.metrics.views),
    },
    {
      label: 'Total Likes',
      value: totalLikes,
      previousValue: prevLikes,
      change: totalLikes - prevLikes,
      changePercent: ((totalLikes - prevLikes) / prevLikes) * 100,
      sparkline: makeSparkline((p) => p.metrics.likes),
    },
    {
      label: 'Commentaires',
      value: totalComments,
      previousValue: prevComments,
      change: totalComments - prevComments,
      changePercent: ((totalComments - prevComments) / prevComments) * 100,
      sparkline: makeSparkline((p) => p.metrics.comments),
    },
    {
      label: 'Engagement Moy.',
      value: avgEngagement,
      previousValue: prevEngagement,
      change: avgEngagement - prevEngagement,
      changePercent: ((avgEngagement - prevEngagement) / prevEngagement) * 100,
      sparkline: makeSparkline((p) => p.metrics.engagementRate),
    },
  ];

  // Platform Stats
  const platformGroups = new Map<string, PostWithMetrics[]>();
  for (const p of posts) {
    const group = platformGroups.get(p.platform) ?? [];
    group.push(p);
    platformGroups.set(p.platform, group);
  }

  const platformStats: PlatformStats[] = [...platformGroups.entries()].map(([platform, pPosts]) => ({
    platform: platform as Platform,
    totalPosts: pPosts.length,
    totalViews: pPosts.reduce((s, p) => s + p.metrics.views, 0),
    totalLikes: pPosts.reduce((s, p) => s + p.metrics.likes, 0),
    avgEngagement: pPosts.reduce((s, p) => s + p.metrics.engagementRate, 0) / pPosts.length,
    color: PLATFORM_COLORS[platform as Platform],
  }));

  // Heatmap
  const heatmapData: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const matching = posts.filter((p) => {
        const d = new Date(p.publishedAt);
        return d.getDay() === (day + 1) % 7 && d.getHours() === hour;
      });
      const avg = matching.length > 0
        ? matching.reduce((s, p) => s + p.metrics.engagementRate, 0) / matching.length
        : 0;
      heatmapData.push({ day, hour, value: avg });
    }
  }

  // Insights
  const dbInsights = await prisma.aIInsight.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const insights: AIInsightData[] = dbInsights.map((i) => ({
    id: i.id,
    type: i.type as AIInsightData['type'],
    content: JSON.parse(i.content),
    score: i.score,
    postId: i.postId ?? undefined,
    createdAt: i.createdAt.toISOString(),
  }));

  return NextResponse.json({
    posts,
    kpis,
    platformStats,
    heatmapData,
    insights,
  });
}
