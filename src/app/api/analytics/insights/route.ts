import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const where = type ? { type } : {};

  const insights = await prisma.aIInsight.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(
    insights.map((i) => ({
      id: i.id,
      type: i.type,
      content: JSON.parse(i.content),
      score: i.score,
      postId: i.postId,
      createdAt: i.createdAt.toISOString(),
    }))
  );
}
