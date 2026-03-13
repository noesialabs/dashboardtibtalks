import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// ═══════════════════════════════════════════════════════════════
// Transcript fetcher — YouTube + TikTok via Apify
// YouTube: karamelo~youtube-transcripts (batch, returns captions array)
// TikTok:  scrape-creators~best-tiktok-transcripts-scraper (batch, returns WebVTT)
// ═══════════════════════════════════════════════════════════════

const APIFY_BASE = 'https://api.apify.com/v2';

const ACTORS = {
  YOUTUBE: 'karamelo~youtube-transcripts',
  TIKTOK: 'scrape-creators~best-tiktok-transcripts-scraper',
} as const;

interface ApifyRunData {
  data: { id: string; status: string; defaultDatasetId: string };
}

// ─── Helpers ───

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/** Convert WebVTT to plain text (remove timestamps and headers) */
function webvttToPlainText(vtt: string): string {
  return vtt
    .split('\n')
    .filter((line) => {
      if (!line.trim()) return false;
      if (line.startsWith('WEBVTT')) return false;
      if (/^\d{2}:\d{2}/.test(line)) return false; // timestamp lines
      return true;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runAndPoll(actorId: string, input: Record<string, unknown>, token: string): Promise<unknown[]> {
  const runRes = await fetch(`${APIFY_BASE}/acts/${actorId}/runs?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!runRes.ok) {
    const err = await runRes.text();
    throw new Error(`Apify run failed (${runRes.status}): ${err}`);
  }

  const runData = (await runRes.json()) as ApifyRunData;
  const runId = runData.data.id;
  const maxWait = 20 * 60 * 1000;
  const pollInterval = 10_000;
  const start = Date.now();
  let status = runData.data.status;
  let datasetId = runData.data.defaultDatasetId;

  while (['READY', 'RUNNING'].includes(status) && Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval));
    const pollRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
    if (pollRes.ok) {
      const pollData = (await pollRes.json()) as ApifyRunData;
      status = pollData.data.status;
      datasetId = pollData.data.defaultDatasetId;
    }
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Actor ${actorId} finished with status: ${status}`);
  }

  const dataRes = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&format=json&clean=true`
  );
  if (!dataRes.ok) throw new Error(`Failed to fetch dataset: ${dataRes.status}`);
  return (await dataRes.json()) as unknown[];
}

// ─── YouTube transcripts ───

interface YTTranscriptItem {
  videoId: string;
  captions?: { text: string }[];
}

async function fetchYouTubeTranscripts(token: string, forceRefresh: boolean) {
  const where = forceRefresh
    ? { platform: 'YOUTUBE', mediaType: 'VIDEO' }
    : { platform: 'YOUTUBE', mediaType: 'VIDEO', transcript: null };

  const posts = await prisma.post.findMany({ where, select: { id: true, platformId: true } });
  if (posts.length === 0) return { platform: 'YOUTUBE', requested: 0, updated: 0, errors: [] as string[] };

  const urls = posts.map((p) => `https://www.youtube.com/watch?v=${p.platformId}`);

  // Batch in chunks of 50 to avoid actor overload
  const BATCH_SIZE = 50;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchPosts = posts.slice(i, i + BATCH_SIZE);

    try {
      const items = (await runAndPoll(ACTORS.YOUTUBE, { urls: batch, language: 'fr' }, token)) as YTTranscriptItem[];

      for (const item of items) {
        if (!item.videoId || !item.captions || item.captions.length === 0) continue;

        const fullText = decodeHtmlEntities(item.captions.map((s) => s.text).join(' '));
        if (!fullText.trim()) continue;

        const post = batchPosts.find((p) => p.platformId === item.videoId);
        if (!post) continue;

        await prisma.post.update({ where: { id: post.id }, data: { transcript: fullText } });
        updated++;
      }
    } catch (e) {
      errors.push(`YouTube batch ${i}-${i + batch.length}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { platform: 'YOUTUBE', requested: posts.length, updated, errors };
}

// ─── TikTok transcripts ───

interface TKTranscriptItem {
  id: string;
  transcript: string | null;
}

async function fetchTikTokTranscripts(token: string, forceRefresh: boolean) {
  const where = forceRefresh
    ? { platform: 'TIKTOK', mediaType: 'VIDEO' }
    : { platform: 'TIKTOK', mediaType: 'VIDEO', transcript: null };

  const posts = await prisma.post.findMany({ where, select: { id: true, platformId: true, url: true } });
  if (posts.length === 0) return { platform: 'TIKTOK', requested: 0, updated: 0, errors: [] as string[] };

  // Build URLs
  const tiktokHandle = process.env.TIKTOK_HANDLE?.replace('@', '') || 'tib.talks';
  const videoUrls = posts.map(
    (p) => p.url || `https://www.tiktok.com/@${tiktokHandle}/video/${p.platformId}`
  );

  // Batch in chunks of 50
  const BATCH_SIZE = 50;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < videoUrls.length; i += BATCH_SIZE) {
    const batch = videoUrls.slice(i, i + BATCH_SIZE);
    const batchPosts = posts.slice(i, i + BATCH_SIZE);

    try {
      const items = (await runAndPoll(ACTORS.TIKTOK, { videos: batch }, token)) as TKTranscriptItem[];

      for (const item of items) {
        if (!item.id || !item.transcript) continue;

        const plainText = webvttToPlainText(item.transcript);
        if (!plainText) continue;

        const post = batchPosts.find((p) => p.platformId === item.id);
        if (!post) continue;

        await prisma.post.update({ where: { id: post.id }, data: { transcript: plainText } });
        updated++;
      }
    } catch (e) {
      errors.push(`TikTok batch ${i}-${i + batch.length}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { platform: 'TIKTOK', requested: posts.length, updated, errors };
}

// ─── Main handler ───

export async function POST(request: Request) {
  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) {
    return NextResponse.json({ success: false, error: 'APIFY_TOKEN not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('force') === 'true';
  const platformParam = searchParams.get('platform')?.toUpperCase();

  const platforms = platformParam ? [platformParam] : ['YOUTUBE', 'TIKTOK'];
  const results: Record<string, { platform: string; requested: number; updated: number; errors: string[] }> = {};

  for (const p of platforms) {
    if (p === 'YOUTUBE') results.youtube = await fetchYouTubeTranscripts(apifyToken, forceRefresh);
    if (p === 'TIKTOK') results.tiktok = await fetchTikTokTranscripts(apifyToken, forceRefresh);
  }

  const totalUpdated = Object.values(results).reduce((s, r) => s + r.updated, 0);
  const allErrors = Object.values(results).flatMap((r) => r.errors);

  return NextResponse.json({
    success: allErrors.length === 0,
    summary: { totalUpdated },
    results,
    errors: allErrors.length > 0 ? allErrors : undefined,
  });
}
