import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const versions = await prisma.promptDNA.findMany({
    include: {
      mutations: { orderBy: { createdAt: 'desc' } },
      performances: { orderBy: { measuredAt: 'desc' }, take: 1 },
    },
    orderBy: { version: 'desc' },
  });

  const result = versions.map((v) => ({
    id: v.id,
    version: v.version,
    platform: v.platform,
    category: v.category,
    promptTemplate: v.promptTemplate,
    rules: JSON.parse(v.rules),
    confidence: v.confidence,
    status: v.status,
    parentVersionId: v.parentVersionId,
    createdAt: v.createdAt.toISOString(),
    activatedAt: v.activatedAt?.toISOString() ?? null,
    performances: v.performances.map((p) => ({
      id: p.id,
      postsGenerated: p.postsGenerated,
      avgEngagementRate: p.avgEngagementRate,
      avgViews: p.avgViews,
      avgLikes: p.avgLikes,
      period: p.period,
      measuredAt: p.measuredAt.toISOString(),
    })),
    mutations: v.mutations.map((m) => ({
      id: m.id,
      mutationType: m.mutationType,
      beforeSnippet: m.beforeSnippet,
      afterSnippet: m.afterSnippet,
      reason: m.reason,
      createdAt: m.createdAt.toISOString(),
    })),
  }));

  return NextResponse.json(result);
}
