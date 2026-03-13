import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// ═══════════════════════════════════════════════════════════════
// Apify-powered social media data fetcher
// Actors: YouTube, Instagram, TikTok, LinkedIn
// ═══════════════════════════════════════════════════════════════

const APIFY_BASE = 'https://api.apify.com/v2';

const ACTORS = {
  YOUTUBE: 'streamers~youtube-scraper',       // Full metrics: likes, comments, views, ISO dates
  INSTAGRAM: 'apify~instagram-scraper',
  TIKTOK: 'clockworks~tiktok-scraper',
  LINKEDIN: 'harvestapi~linkedin-profile-posts',
} as const;

const SOCIAL_URLS = {
  YOUTUBE: process.env.YOUTUBE_URL || 'https://www.youtube.com/@TIBTalks',
  INSTAGRAM: process.env.INSTAGRAM_URL || 'https://www.instagram.com/tibtalks_off/',
  TIKTOK: process.env.TIKTOK_HANDLE?.replace('@', '') || 'tib.talks',
  LINKEDIN: process.env.LINKEDIN_URL || 'https://www.linkedin.com/in/thibaultdoutriaux/',
};

interface ApifyRunResult {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

interface FetchResult {
  inserted: number;
  updated: number;
  errors: string[];
}

// ─── Apify helpers ───

async function runApifyActor(actorId: string, input: Record<string, unknown>, token: string): Promise<unknown[]> {
  // Start actor run
  const runRes = await fetch(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  if (!runRes.ok) {
    const err = await runRes.text();
    throw new Error(`Apify run failed (${runRes.status}): ${err}`);
  }

  const runData = (await runRes.json()) as ApifyRunResult;
  const runId = runData.data.id;

  // Poll for completion (max 15 min)
  const maxWait = 15 * 60 * 1000;
  const pollInterval = 10_000;
  const start = Date.now();
  let status = runData.data.status;
  let datasetId = runData.data.defaultDatasetId;

  while (['READY', 'RUNNING'].includes(status) && Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval));
    const pollRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
    if (pollRes.ok) {
      const pollData = (await pollRes.json()) as ApifyRunResult;
      status = pollData.data.status;
      datasetId = pollData.data.defaultDatasetId;
    }
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Apify actor ${actorId} finished with status: ${status}`);
  }

  // Fetch results from dataset
  const dataRes = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&format=json&clean=true`
  );

  if (!dataRes.ok) {
    throw new Error(`Failed to fetch dataset: ${dataRes.status}`);
  }

  return (await dataRes.json()) as unknown[];
}

// ─── YouTube ───

interface YTVideo {
  id?: string;
  videoId?: string;
  title?: string;
  viewCount?: number;
  views?: number;
  likes?: number;
  likeCount?: number;
  commentsCount?: number;
  commentCount?: number;
  comments?: number;
  date?: string;
  uploadDate?: string;
  publishedAt?: string;
  duration?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  url?: string;
  type?: string;
}

/** Parse relative dates like "9 months ago", "1 year ago", "2 days ago" */
function parseRelativeDate(dateStr: string): Date {
  const now = new Date();
  const match = dateStr.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (!match) {
    // Try parsing as absolute date
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? now : d;
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 'second': now.setSeconds(now.getSeconds() - amount); break;
    case 'minute': now.setMinutes(now.getMinutes() - amount); break;
    case 'hour': now.setHours(now.getHours() - amount); break;
    case 'day': now.setDate(now.getDate() - amount); break;
    case 'week': now.setDate(now.getDate() - amount * 7); break;
    case 'month': now.setMonth(now.getMonth() - amount); break;
    case 'year': now.setFullYear(now.getFullYear() - amount); break;
  }
  return now;
}

async function fetchYouTube(token: string): Promise<FetchResult> {
  const errors: string[] = [];
  let inserted = 0, updated = 0;

  try {
    const items = await runApifyActor(ACTORS.YOUTUBE, {
      startUrls: [{ url: SOCIAL_URLS.YOUTUBE }],
      maxResults: 200,
      type: 'video',
    }, token) as YTVideo[];

    for (const v of items) {
      const videoId = v.id || v.videoId;
      if (!videoId || v.type === 'channel') continue;

      const views = v.viewCount ?? v.views ?? 0;
      const likes = v.likes ?? v.likeCount ?? 0;
      const comments = v.commentsCount ?? v.commentCount ?? v.comments ?? 0;
      const engRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

      const dateStr = v.date || v.uploadDate || v.publishedAt;
      const publishedAt = dateStr ? parseRelativeDate(dateStr) : new Date();

      const thumb = v.thumbnailUrl || v.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const existing = await prisma.post.findUnique({
        where: { platform_platformId: { platform: 'YOUTUBE', platformId: videoId } },
      });

      if (existing) {
        await prisma.postMetrics.create({
          data: {
            postId: existing.id,
            views, likes, comments, shares: 0, saves: 0,
            engagementRate: Math.round(engRate * 100) / 100,
          },
        });
        // Update title if changed
        if (v.title && v.title !== existing.title) {
          await prisma.post.update({ where: { id: existing.id }, data: { title: v.title } });
        }
        updated++;
      } else {
        const post = await prisma.post.create({
          data: {
            platformId: videoId,
            platform: 'YOUTUBE',
            title: v.title || 'Sans titre',
            content: v.title || '',
            mediaType: 'VIDEO',
            mediaUrl: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailUrl: thumb,
            publishedAt,
            url: v.url || `https://www.youtube.com/watch?v=${videoId}`,
          },
        });
        await prisma.postMetrics.create({
          data: {
            postId: post.id,
            views, likes, comments, shares: 0, saves: 0,
            engagementRate: Math.round(engRate * 100) / 100,
          },
        });
        inserted++;
      }
    }
  } catch (e) {
    errors.push(`YouTube: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { inserted, updated, errors };
}

// ─── Instagram ───

interface IGPost {
  id?: string;
  shortCode?: string;
  url?: string;
  type?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  timestamp?: string;
  displayUrl?: string;
  ownerUsername?: string;
}

async function fetchInstagram(token: string): Promise<FetchResult> {
  const errors: string[] = [];
  let inserted = 0, updated = 0;

  try {
    const items = await runApifyActor(ACTORS.INSTAGRAM, {
      directUrls: [SOCIAL_URLS.INSTAGRAM],
      resultsType: 'posts',
      resultsLimit: 500,
    }, token) as IGPost[];

    for (const p of items) {
      const postId = p.shortCode || p.id;
      if (!postId) continue;

      const likes = p.likesCount ?? 0;
      const comments = p.commentsCount ?? 0;
      const views = p.videoViewCount ?? likes * 10; // estimate for images
      const engRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

      const publishedAt = p.timestamp ? new Date(p.timestamp) : new Date();

      const mediaType = p.type === 'Video' ? 'VIDEO'
        : p.type === 'Sidecar' ? 'CAROUSEL'
        : 'IMAGE';

      const existing = await prisma.post.findUnique({
        where: { platform_platformId: { platform: 'INSTAGRAM', platformId: postId } },
      });

      if (existing) {
        await prisma.postMetrics.create({
          data: {
            postId: existing.id,
            views, likes, comments, shares: 0, saves: 0,
            engagementRate: Math.round(engRate * 100) / 100,
          },
        });
        updated++;
      } else {
        const post = await prisma.post.create({
          data: {
            platformId: postId,
            platform: 'INSTAGRAM',
            title: (p.caption || '').slice(0, 200),
            content: p.caption || '',
            mediaType,
            mediaUrl: p.url || `https://www.instagram.com/p/${postId}/`,
            thumbnailUrl: p.displayUrl || null,
            publishedAt,
            url: p.url || `https://www.instagram.com/p/${postId}/`,
          },
        });
        await prisma.postMetrics.create({
          data: {
            postId: post.id,
            views, likes, comments, shares: 0, saves: 0,
            engagementRate: Math.round(engRate * 100) / 100,
          },
        });
        inserted++;
      }
    }
  } catch (e) {
    errors.push(`Instagram: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { inserted, updated, errors };
}

// ─── TikTok ───

interface TKVideo {
  id?: string;
  text?: string;
  desc?: string;
  playCount?: number;
  diggCount?: number;
  commentCount?: number;
  shareCount?: number;
  collectCount?: number;
  createTime?: number;
  createTimeISO?: string;
  webVideoUrl?: string;
  videoUrl?: string;
  coverUrl?: string;
  authorMeta?: {
    name?: string;
    nickName?: string;
    fans?: number;
  };
}

async function fetchTikTok(token: string): Promise<FetchResult> {
  const errors: string[] = [];
  let inserted = 0, updated = 0;

  try {
    const items = await runApifyActor(ACTORS.TIKTOK, {
      profiles: [SOCIAL_URLS.TIKTOK],
      resultsPerPage: 500,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    }, token) as TKVideo[];

    for (const v of items) {
      const videoId = v.id;
      if (!videoId) continue;

      const views = v.playCount ?? 0;
      const likes = v.diggCount ?? 0;
      const comments = v.commentCount ?? 0;
      const shares = v.shareCount ?? 0;
      const saves = v.collectCount ?? 0;
      const engRate = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;

      const publishedAt = v.createTime
        ? new Date(v.createTime * 1000)
        : v.createTimeISO
          ? new Date(v.createTimeISO)
          : new Date();

      const title = v.text || v.desc || '';

      const existing = await prisma.post.findUnique({
        where: { platform_platformId: { platform: 'TIKTOK', platformId: videoId } },
      });

      if (existing) {
        await prisma.postMetrics.create({
          data: {
            postId: existing.id,
            views, likes, comments, shares, saves,
            engagementRate: Math.round(engRate * 100) / 100,
          },
        });
        updated++;
      } else {
        const postUrl = v.webVideoUrl || `https://www.tiktok.com/@${SOCIAL_URLS.TIKTOK}/video/${videoId}`;
        const post = await prisma.post.create({
          data: {
            platformId: videoId,
            platform: 'TIKTOK',
            title: title.slice(0, 200),
            content: title,
            mediaType: 'VIDEO',
            mediaUrl: postUrl,
            thumbnailUrl: v.coverUrl || null,
            publishedAt,
            url: postUrl,
          },
        });
        await prisma.postMetrics.create({
          data: {
            postId: post.id,
            views, likes, comments, shares, saves,
            engagementRate: Math.round(engRate * 100) / 100,
          },
        });
        inserted++;
      }
    }
  } catch (e) {
    errors.push(`TikTok: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { inserted, updated, errors };
}

// ─── LinkedIn ───

// LinkedIn items are top-level (not nested under `post`)
interface LIPost {
  id?: string;
  content?: string;
  linkedinUrl?: string;
  postedAt?: {
    timestamp?: number;
    date?: string;
  };
  postImages?: { url: string }[];
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

async function fetchLinkedIn(token: string): Promise<FetchResult> {
  const errors: string[] = [];
  let inserted = 0, updated = 0;

  try {
    const items = await runApifyActor(ACTORS.LINKEDIN, {
      profileUrls: [SOCIAL_URLS.LINKEDIN],
      maxPosts: 200,
    }, token) as LIPost[];

    for (const p of items) {
      const postId = p.id ? String(p.id) : null;
      if (!postId) continue;

      const likes = p.engagement?.likes ?? 0;
      const comments = p.engagement?.comments ?? 0;
      const shares = p.engagement?.shares ?? 0;
      const views = (likes + comments + shares) * 8; // LinkedIn doesn't expose views
      const engRate = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;

      const publishedAt = p.postedAt?.timestamp
        ? new Date(p.postedAt.timestamp)
        : p.postedAt?.date
          ? new Date(p.postedAt.date)
          : new Date();

      const mediaType = (p.postImages && p.postImages.length > 1) ? 'CAROUSEL'
        : (p.postImages && p.postImages.length === 1) ? 'IMAGE'
        : 'TEXT';

      const existing = await prisma.post.findUnique({
        where: { platform_platformId: { platform: 'LINKEDIN', platformId: postId } },
      });

      if (existing) {
        await prisma.postMetrics.create({
          data: {
            postId: existing.id,
            views, likes, comments, shares, saves: 0,
            engagementRate: Math.round(engRate * 100) / 100,
          },
        });
        updated++;
      } else {
        const post = await prisma.post.create({
          data: {
            platformId: postId,
            platform: 'LINKEDIN',
            title: (p.content || '').slice(0, 200),
            content: p.content || '',
            mediaType,
            mediaUrl: p.linkedinUrl || null,
            thumbnailUrl: p.postImages?.[0]?.url || null,
            publishedAt,
            url: p.linkedinUrl || null,
          },
        });
        await prisma.postMetrics.create({
          data: {
            postId: post.id,
            views, likes, comments, shares, saves: 0,
            engagementRate: Math.round(engRate * 100) / 100,
          },
        });
        inserted++;
      }
    }
  } catch (e) {
    errors.push(`LinkedIn: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { inserted, updated, errors };
}

// ─── Main handler ───

export async function POST(request: Request) {
  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) {
    return NextResponse.json(
      { success: false, error: 'APIFY_TOKEN not configured in .env' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform')?.toUpperCase();

  const results: Record<string, FetchResult> = {};
  const platforms = platform
    ? [platform]
    : ['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'LINKEDIN'];

  for (const p of platforms) {
    switch (p) {
      case 'YOUTUBE':
        results.youtube = await fetchYouTube(apifyToken);
        break;
      case 'INSTAGRAM':
        results.instagram = await fetchInstagram(apifyToken);
        break;
      case 'TIKTOK':
        results.tiktok = await fetchTikTok(apifyToken);
        break;
      case 'LINKEDIN':
        results.linkedin = await fetchLinkedIn(apifyToken);
        break;
    }
  }

  const totalInserted = Object.values(results).reduce((s, r) => s + r.inserted, 0);
  const totalUpdated = Object.values(results).reduce((s, r) => s + r.updated, 0);
  const allErrors = Object.values(results).flatMap((r) => r.errors);

  return NextResponse.json({
    success: allErrors.length === 0,
    summary: { inserted: totalInserted, updated: totalUpdated },
    results,
    errors: allErrors.length > 0 ? allErrors : undefined,
  });
}
