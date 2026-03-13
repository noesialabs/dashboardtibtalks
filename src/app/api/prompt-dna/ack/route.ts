import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  const { exportId } = await request.json();

  if (!exportId) {
    return NextResponse.json({ error: 'exportId required' }, { status: 400 });
  }

  await prisma.contentBrainExport.update({
    where: { id: exportId },
    data: { status: 'ACKNOWLEDGED' },
  });

  await prisma.contentBrainSync.create({
    data: {
      exportId,
      status: 'SUCCESS',
      contentBrainResponse: JSON.stringify({ acknowledged: true }),
    },
  });

  return NextResponse.json({ success: true });
}
