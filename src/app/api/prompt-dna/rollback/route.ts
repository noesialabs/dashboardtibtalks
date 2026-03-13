import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  const { targetVersionId } = await request.json();

  if (!targetVersionId) {
    return NextResponse.json({ error: 'targetVersionId required' }, { status: 400 });
  }

  // Set current active to ROLLED_BACK
  await prisma.promptDNA.updateMany({
    where: { status: 'ACTIVE' },
    data: { status: 'ROLLED_BACK' },
  });

  // Set target to ACTIVE
  const updated = await prisma.promptDNA.update({
    where: { id: targetVersionId },
    data: { status: 'ACTIVE', activatedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    activatedVersion: updated.version,
  });
}
