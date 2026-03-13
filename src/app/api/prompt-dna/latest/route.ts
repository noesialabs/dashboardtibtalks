import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const category = searchParams.get('category');

  const where: Record<string, unknown> = { status: 'ACTIVE' };
  if (platform) where.platform = platform;
  if (category) where.category = category;

  const dna = await prisma.promptDNA.findFirst({
    where,
    include: { performances: { take: 1, orderBy: { measuredAt: 'desc' } } },
    orderBy: { version: 'desc' },
  });

  if (!dna) {
    return NextResponse.json({ error: 'No active DNA found' }, { status: 404 });
  }

  return NextResponse.json({
    id: dna.id,
    version: dna.version,
    platform: dna.platform,
    category: dna.category,
    promptTemplate: dna.promptTemplate,
    rules: JSON.parse(dna.rules),
    confidence: dna.confidence,
    performance: dna.performances[0] ?? null,
  });
}
