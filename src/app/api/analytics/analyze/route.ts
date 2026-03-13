import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  const { postIds } = await request.json();

  // If no specific posts, analyze the latest 10
  const posts = await prisma.post.findMany({
    where: postIds?.length ? { id: { in: postIds } } : {},
    include: { metrics: { orderBy: { fetchedAt: 'desc' }, take: 1 } },
    orderBy: { publishedAt: 'desc' },
    take: 10,
  });

  if (posts.length === 0) {
    return NextResponse.json({ error: 'No posts to analyze' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const postsData = posts.map((p) => ({
    id: p.id,
    platform: p.platform,
    title: p.title,
    content: p.content?.slice(0, 200),
    transcript: p.transcript || null,
    mediaType: p.mediaType,
    metrics: {
      views: p.metrics[0]?.views ?? 0,
      likes: p.metrics[0]?.likes ?? 0,
      comments: p.metrics[0]?.comments ?? 0,
      shares: p.metrics[0]?.shares ?? 0,
      engagement: p.metrics[0]?.engagementRate ?? 0,
    },
    publishedAt: p.publishedAt.toISOString(),
  }));

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Analyse ces posts de réseaux sociaux pour le créateur "TibTalks" (business/tech/crypto).
Pour chaque post, génère un insight. Utilise les transcripts vidéo quand ils sont disponibles pour analyser le contenu du script (hooks, structure, ton, sujets abordés).

Posts :
${JSON.stringify(postsData, null, 2)}

Réponds en JSON uniquement au format :
{
  "insights": [
    {
      "postId": "id du post ou null pour insight global",
      "type": "POST_ANALYSIS" | "TREND" | "RECOMMENDATION" | "DNA_FUEL",
      "content": {
        "title": "titre court",
        "summary": "résumé en 1-2 phrases",
        "details": "détails (inclure l'analyse du script/transcript si disponible)",
        "recommendations": ["reco1", "reco2"]
      },
      "score": 0-100
    }
  ]
}

Inclus au moins : 2 analyses de posts (avec analyse du transcript si dispo), 1 tendance, 1 recommandation, 1 DNA_FUEL.`,
      },
    ],
  });

  let insightsData;
  try {
    const textContent = message.content.find((c) => c.type === 'text');
    const jsonStr = textContent?.text ?? '{}';
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, jsonStr];
    insightsData = JSON.parse(jsonMatch[1] ?? '{}');
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  // Save insights
  const created = [];
  for (const insight of insightsData.insights ?? []) {
    const record = await prisma.aIInsight.create({
      data: {
        postId: insight.postId || null,
        type: insight.type,
        content: JSON.stringify(insight.content),
        score: insight.score ?? 50,
      },
    });
    created.push(record);
  }

  return NextResponse.json({
    success: true,
    insightsCreated: created.length,
  });
}
