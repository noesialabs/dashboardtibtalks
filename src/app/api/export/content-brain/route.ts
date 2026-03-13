import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  // Get active DNA
  const activeDNA = await prisma.promptDNA.findFirst({
    where: { status: 'ACTIVE' },
    include: {
      mutations: { orderBy: { createdAt: 'desc' }, take: 10 },
      performances: { orderBy: { measuredAt: 'desc' }, take: 1 },
    },
  });

  if (!activeDNA) {
    return NextResponse.json({ error: 'No active Prompt DNA' }, { status: 404 });
  }

  // Get recent insights
  const insights = await prisma.aIInsight.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const rules = JSON.parse(activeDNA.rules);

  // Build export payload
  const payload = {
    exportDate: new Date().toISOString(),
    promptDNA: {
      version: activeDNA.version,
      confidence: activeDNA.confidence,
      scriptPrompt: activeDNA.promptTemplate,
      captionPrompt: `Génère une caption ${rules.toneProfile ? `(ton: ${Object.entries(rules.toneProfile).map(([k, v]) => `${k}:${Math.round((v as number) * 100)}%`).join(', ')})` : ''} pour un post sur {sujet}. Max ${rules.optimalLength?.max ?? 60} mots. Hashtags: ${rules.topHashtags?.join(' ') ?? ''}`,
      hookPrompt: `Génère 5 hooks percutants pour un post sur {sujet}. Styles préférés: ${rules.hookPatterns?.map((h: { pattern: string }) => h.pattern).join(', ') ?? 'varié'}. Exemples de hooks qui marchent: ${rules.hookPatterns?.map((h: { example: string }) => h.example).join(' | ') ?? ''}`,
      rules,
    },
    insights: {
      topPerformingFormats: rules.bestFormats ?? [],
      topPerformingTopics: rules.topPerformingTopics ?? [],
      bestPostingTimes: rules.bestPostingTimes ?? [],
      contentRecommendations: insights
        .filter((i) => i.type === 'RECOMMENDATION')
        .map((i) => JSON.parse(i.content)),
      avoidPatterns: {
        topics: rules.avoidTopics ?? [],
        hashtags: rules.avoidHashtags ?? [],
      },
    },
    instructions: {
      changelog: activeDNA.mutations.map((m) => ({
        type: m.mutationType,
        before: m.beforeSnippet,
        after: m.afterSnippet,
        reason: m.reason,
      })),
      promptsToUpdate: [
        {
          promptId: 'script-generator',
          currentVersion: activeDNA.version,
          newPromptTemplate: activeDNA.promptTemplate,
          reason: 'Auto-updated from dashboard insights',
        },
      ],
      priority: activeDNA.confidence > 0.7 ? 'HIGH' : 'MEDIUM',
    },
  };

  // Save export
  const exportRecord = await prisma.contentBrainExport.create({
    data: {
      promptDNAId: activeDNA.id,
      promptDNAVersion: activeDNA.version,
      insightIds: JSON.stringify(insights.map((i) => i.id)),
      payload: JSON.stringify(payload),
      status: 'SENT',
    },
  });

  return NextResponse.json({
    ...payload,
    exportId: exportRecord.id,
  });
}
