import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import Anthropic from '@anthropic-ai/sdk';

export async function POST() {
  // Get active DNA
  const activeDNA = await prisma.promptDNA.findFirst({
    where: { status: 'ACTIVE' },
    include: { performances: true, mutations: true },
  });

  if (!activeDNA) {
    return NextResponse.json({ error: 'No active Prompt DNA found' }, { status: 404 });
  }

  // Get recent insights
  const insights = await prisma.aIInsight.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Get recent post performance
  const recentPosts = await prisma.post.findMany({
    include: { metrics: { orderBy: { fetchedAt: 'desc' }, take: 1 } },
    orderBy: { publishedAt: 'desc' },
    take: 30,
  });

  const currentRules = JSON.parse(activeDNA.rules);

  // Call Claude for mutations
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Tu es un expert en optimisation de prompts pour la création de contenu social media.

Voici le Prompt DNA actuel (version ${activeDNA.version}) :
${JSON.stringify(currentRules, null, 2)}

Voici les derniers insights du dashboard :
${JSON.stringify(insights.map((i) => JSON.parse(i.content)), null, 2)}

Voici la performance des 30 derniers posts (avec transcripts vidéo quand disponibles — utilise-les pour analyser les hooks, la structure narrative, le ton) :
${JSON.stringify(recentPosts.map((p) => ({
  platform: p.platform,
  title: p.title,
  transcript: p.transcript?.slice(0, 300) || null,
  views: p.metrics[0]?.views,
  likes: p.metrics[0]?.likes,
  engagement: p.metrics[0]?.engagementRate,
})), null, 2)}

Analyse les écarts et propose des MUTATIONS précises. Réponds UNIQUEMENT avec un JSON valide au format :
{
  "mutations": [
    {
      "mutationType": "RULE_MODIFIED" | "RULE_ADDED" | "RULE_REMOVED" | "TONE_SHIFT" | "FORMAT_CHANGE" | "HOOK_PATTERN_UPDATE",
      "beforeSnippet": "texte avant ou null",
      "afterSnippet": "texte après",
      "reason": "justification basée sur les données"
    }
  ],
  "updatedRules": { ... le nouveau JSON de rules complet ... },
  "updatedPromptTemplate": "le nouveau prompt template complet",
  "confidence": 0.0-1.0
}

Sois conservateur : max 3-4 mutations, et uniquement celles soutenues par les données.`,
      },
    ],
  });

  let mutationData;
  try {
    const textContent = message.content.find((c) => c.type === 'text');
    const jsonStr = textContent?.text ?? '{}';
    // Extract JSON from markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, jsonStr];
    mutationData = JSON.parse(jsonMatch[1] ?? '{}');
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  // Create new version
  const newVersion = await prisma.promptDNA.create({
    data: {
      version: activeDNA.version + 1,
      platform: activeDNA.platform,
      category: activeDNA.category,
      status: 'TESTING',
      confidence: mutationData.confidence ?? activeDNA.confidence,
      parentVersionId: activeDNA.id,
      promptTemplate: mutationData.updatedPromptTemplate ?? activeDNA.promptTemplate,
      rules: JSON.stringify(mutationData.updatedRules ?? currentRules),
    },
  });

  // Log mutations
  if (mutationData.mutations?.length) {
    await prisma.promptMutation.createMany({
      data: mutationData.mutations.map((m: { mutationType: string; beforeSnippet?: string; afterSnippet?: string; reason: string }) => ({
        promptDNAId: newVersion.id,
        mutationType: m.mutationType,
        beforeSnippet: m.beforeSnippet ?? null,
        afterSnippet: m.afterSnippet ?? null,
        reason: m.reason,
      })),
    });
  }

  return NextResponse.json({
    success: true,
    newVersion: {
      id: newVersion.id,
      version: newVersion.version,
      status: newVersion.status,
      mutations: mutationData.mutations?.length ?? 0,
    },
  });
}
