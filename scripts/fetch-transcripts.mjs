import Database from 'better-sqlite3';

const db = new Database('dev.db');
const APIFY_BASE = 'https://api.apify.com/v2';
const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) { console.error('APIFY_TOKEN env var is required'); process.exit(1); }

function decodeHtml(text) {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function webvttToText(vtt) {
  return vtt.split('\n')
    .filter(line => line.trim() && !line.startsWith('WEBVTT') && !/^\d{2}:\d{2}/.test(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runAndPoll(actorId, input) {
  console.log(`Starting actor ${actorId}...`);
  const runRes = await fetch(`${APIFY_BASE}/acts/${actorId}/runs?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const runData = await runRes.json();
  if (runData.error) throw new Error(JSON.stringify(runData.error));

  const runId = runData.data.id;
  let status = runData.data.status;
  let datasetId = runData.data.defaultDatasetId;
  const start = Date.now();

  while (['READY', 'RUNNING'].includes(status) && Date.now() - start < 20 * 60 * 1000) {
    await new Promise(r => setTimeout(r, 10000));
    const pollRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${TOKEN}`);
    const pollData = await pollRes.json();
    status = pollData.data.status;
    datasetId = pollData.data.defaultDatasetId;
    process.stdout.write('.');
  }
  console.log(` ${status}`);

  if (status !== 'SUCCEEDED') throw new Error(`Actor finished with status: ${status}`);

  const dataRes = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${TOKEN}&format=json&clean=true`);
  return await dataRes.json();
}

// ─── YouTube ───
async function fetchYouTubeTranscripts() {
  const posts = db.prepare("SELECT id, platformId FROM Post WHERE platform = 'YOUTUBE' AND transcript IS NULL").all();
  if (posts.length === 0) { console.log('YouTube: all videos already have transcripts'); return; }

  console.log(`YouTube: ${posts.length} videos to transcribe`);
  const BATCH = 50;
  let total = 0;

  for (let i = 0; i < posts.length; i += BATCH) {
    const batch = posts.slice(i, i + BATCH);
    const urls = batch.map(p => `https://www.youtube.com/watch?v=${p.platformId}`);

    try {
      const items = await runAndPoll('karamelo~youtube-transcripts', { urls, language: 'fr' });

      for (const item of items) {
        if (!item.videoId || !item.captions || !Array.isArray(item.captions) || item.captions.length === 0) continue;
        // Captions can be strings or objects with .text
        const text = decodeHtml(item.captions.filter(s => s).map(s => typeof s === 'string' ? s : s.text || '').filter(Boolean).join(' '));
        if (!text.trim()) continue;

        const post = batch.find(p => p.platformId === item.videoId);
        if (post) {
          db.prepare('UPDATE Post SET transcript = ? WHERE id = ?').run(text, post.id);
          total++;
        }
      }
      console.log(`  Batch ${i}-${i + batch.length}: ${items.length} results, ${total} updated so far`);
    } catch (e) {
      console.error(`  Batch error: ${e.message}`);
    }
  }
  console.log(`YouTube done: ${total}/${posts.length} transcribed`);
}

// ─── TikTok ───
async function fetchTikTokTranscripts() {
  const posts = db.prepare("SELECT id, platformId, url FROM Post WHERE platform = 'TIKTOK' AND transcript IS NULL").all();
  if (posts.length === 0) { console.log('TikTok: all videos already have transcripts'); return; }

  console.log(`TikTok: ${posts.length} videos to transcribe`);
  const BATCH = 50;
  let total = 0;

  for (let i = 0; i < posts.length; i += BATCH) {
    const batch = posts.slice(i, i + BATCH);
    const videos = batch.map(p => p.url || `https://www.tiktok.com/@tib.talks/video/${p.platformId}`);

    try {
      const items = await runAndPoll('scrape-creators~best-tiktok-transcripts-scraper', { videos });

      for (const item of items) {
        if (!item.id || !item.transcript) continue;
        const text = webvttToText(item.transcript);
        if (!text) continue;

        const post = batch.find(p => p.platformId === item.id);
        if (post) {
          db.prepare('UPDATE Post SET transcript = ? WHERE id = ?').run(text, post.id);
          total++;
        }
      }
      console.log(`  Batch ${i}-${i + batch.length}: ${items.length} results, ${total} updated so far`);
    } catch (e) {
      console.error(`  Batch error: ${e.message}`);
    }
  }
  console.log(`TikTok done: ${total}/${posts.length} transcribed`);
}

// ─── Main ───
const platform = process.argv[2]?.toUpperCase();

if (!platform || platform === 'YOUTUBE') await fetchYouTubeTranscripts();
if (!platform || platform === 'TIKTOK') await fetchTikTokTranscripts();

db.close();
console.log('Done!');
