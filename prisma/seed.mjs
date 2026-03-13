import { PrismaClient } from '../src/generated/prisma/client.ts';

const prisma = new PrismaClient();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randomInt(6, 22), randomInt(0, 59), 0, 0);
  return d;
}

const platforms = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN'];

const topics = [
  'productivité', 'IA', 'mindset', 'business', 'tech', 'finance',
  'leadership', 'motivation', 'crypto', 'startups', 'marketing', 'freelance',
];

const titleTemplates = {
  INSTAGRAM: [
    '🚀 {topic} : 5 secrets que personne ne te dit',
    '💡 Comment j\'ai transformé mon {topic} en 30 jours',
    '⚡ {topic} — Stop les excuses, voici la vérité',
    '🔥 Le hack {topic} que les pros utilisent',
    '📈 Mon parcours {topic} : les chiffres réels',
    '❌ 3 erreurs {topic} qui te coûtent cher',
  ],
  TIKTOK: [
    '{topic} hack qui va changer ta vie',
    'POV: Tu découvres ce secret {topic}',
    'Arrête tout et écoute ce conseil {topic}',
    'Reply to @user — mon avis sur {topic}',
    'Ce que personne ne dit sur {topic}',
    '{topic} en 60 secondes ⏱️',
  ],
  YOUTUBE: [
    'J\'ai testé {topic} pendant 30 jours — Résultats choquants',
    '{topic} : Le guide COMPLET pour débutants (2024)',
    'Pourquoi 99% échouent en {topic} (et comment réussir)',
    '{topic} — Mon secret pour gagner du temps',
    'Le futur de {topic} — Ce que personne ne voit venir',
    '{topic} : Réaction à vos commentaires',
  ],
  LINKEDIN: [
    'J\'ai quitté mon CDI pour {topic}. Voici ce que j\'ai appris.',
    '{topic} : 7 leçons après 5 ans d\'expérience',
    'Le mythe de {topic} — Parlons franchement',
    'Pourquoi {topic} est la compétence n°1 en 2024',
    '{topic} : une réflexion qui va vous faire réfléchir',
    'Retour d\'expérience : {topic} en entreprise',
  ],
};

const contentTemplates = [
  'Après des mois de tests, voici ce que j\'ai découvert sur {topic}. La plupart des gens font l\'erreur de négliger les fondamentaux.',
  'Tu veux progresser en {topic} ? Arrête de scroller et lis ça. Le secret, c\'est la régularité.',
  '{topic} a complètement changé ma vision du business. Voici pourquoi tu devrais t\'y intéresser dès maintenant.',
  'On m\'a demandé mon meilleur conseil en {topic}. Le voici : commence avant d\'être prêt.',
  'J\'ai analysé les 100 meilleurs créateurs de contenu sur {topic}. Pattern commun : ils sont tous obsédés par la valeur.',
];

const metricsMultiplier = {
  INSTAGRAM: { views: [500, 15000], likes: [50, 2000], comments: [5, 200], shares: [2, 100], saves: [10, 300] },
  TIKTOK: { views: [1000, 100000], likes: [100, 10000], comments: [10, 500], shares: [5, 1000], saves: [20, 500] },
  YOUTUBE: { views: [200, 50000], likes: [20, 3000], comments: [5, 300], shares: [2, 200], saves: [0, 0] },
  LINKEDIN: { views: [100, 8000], likes: [10, 500], comments: [3, 80], shares: [1, 50], saves: [0, 0] },
};

async function seedPosts() {
  console.log('Seeding posts...');
  const posts = [];

  for (let i = 0; i < 120; i++) {
    const platform = randomPick(platforms);
    const topic = randomPick(topics);
    const daysBack = randomInt(1, 90);
    const publishedAt = daysAgo(daysBack);
    const isViral = Math.random() < 0.15;
    const viralMultiplier = isViral ? randomFloat(3, 8) : 1;

    const m = metricsMultiplier[platform];
    const views = Math.floor(randomInt(...m.views) * viralMultiplier);
    const likes = Math.floor(randomInt(...m.likes) * viralMultiplier);
    const comments = Math.floor(randomInt(...m.comments) * viralMultiplier);
    const shares = Math.floor(randomInt(...m.shares) * viralMultiplier);
    const saves = Math.floor(randomInt(...m.saves) * viralMultiplier);
    const engagementRate = views > 0 ? ((likes + comments + shares + saves) / views) * 100 : 0;

    const titleTemplate = randomPick(titleTemplates[platform]);
    const title = titleTemplate.replace('{topic}', topic);
    const contentTemplate = randomPick(contentTemplates);
    const content = contentTemplate.replace(/\{topic\}/g, topic);

    const mediaTypes = platform === 'LINKEDIN' ? ['TEXT', 'IMAGE', 'CAROUSEL'] :
      platform === 'YOUTUBE' ? ['VIDEO'] :
      ['VIDEO', 'IMAGE', 'CAROUSEL'];

    const post = await prisma.post.create({
      data: {
        platformId: `${platform.toLowerCase()}_${Date.now()}_${i}`,
        platform,
        title,
        content,
        mediaType: randomPick(mediaTypes),
        thumbnailUrl: `https://picsum.photos/seed/${i}/400/400`,
        publishedAt,
        url: `https://${platform.toLowerCase()}.com/tibtalks/post_${i}`,
        metrics: {
          create: {
            views,
            likes,
            comments,
            shares,
            saves,
            engagementRate: Math.round(engagementRate * 100) / 100,
            fetchedAt: new Date(),
          },
        },
      },
    });
    posts.push(post);
  }

  console.log(`Created ${posts.length} posts with metrics`);
  return posts;
}

async function seedPromptDNA() {
  console.log('Seeding Prompt DNA versions...');

  const v1 = await prisma.promptDNA.create({
    data: {
      version: 1,
      platform: null,
      category: 'SCRIPT',
      status: 'DEPRECATED',
      confidence: 0.45,
      createdAt: daysAgo(60),
      activatedAt: daysAgo(60),
      promptTemplate: `Tu es un créateur de contenu expert. Génère un script vidéo sur le sujet donné.\nUtilise un ton engageant et éducatif. Le script doit faire entre 60 et 90 secondes.\nCommence par un hook percutant. Termine par un call-to-action.`,
      rules: JSON.stringify({
        optimalLength: { min: 60, max: 90, unit: 'seconds' },
        bestFormats: ['listicle', 'how-to'],
        topPerformingTopics: ['productivité', 'IA'],
        avoidTopics: [],
        toneProfile: { formal: 0.3, humorous: 0.2, provocative: 0.1, educational: 0.7, inspirational: 0.4 },
        hookPatterns: [
          { pattern: 'Question rhétorique', example: 'Tu savais que 90% des gens...', avgEngagement: 3.2, timesUsed: 8 },
          { pattern: 'Chiffre choc', example: "J'ai gagné 10k€ en...", avgEngagement: 2.8, timesUsed: 5 },
        ],
        bestPostingTimes: [
          { dayOfWeek: 1, hourUTC: 18, avgEngagement: 4.1 },
          { dayOfWeek: 3, hourUTC: 12, avgEngagement: 3.8 },
        ],
        bestCTAs: [{ text: 'Abonne-toi pour plus', position: 'end', avgConversion: 2.1 }],
        topHashtags: ['#business', '#motivation', '#entrepreneur'],
        avoidHashtags: [],
      }),
    },
  });

  const v2 = await prisma.promptDNA.create({
    data: {
      version: 2,
      platform: null,
      category: 'SCRIPT',
      status: 'DEPRECATED',
      confidence: 0.62,
      parentVersionId: v1.id,
      createdAt: daysAgo(40),
      activatedAt: daysAgo(40),
      promptTemplate: `Tu es un créateur de contenu expert spécialisé dans le business et la tech.\nGénère un script vidéo percutant sur le sujet donné.\nRÈGLES :\n- Commence TOUJOURS par un hook de type "Question rhétorique" ou "Chiffre choc"\n- Ton : 70% éducatif, 30% provocateur\n- Durée : 45-75 secondes\n- Structure : Hook → Problème → Solution → Preuve → CTA\n- CTA : "Commente [mot] si tu veux la suite"`,
      rules: JSON.stringify({
        optimalLength: { min: 45, max: 75, unit: 'seconds' },
        bestFormats: ['listicle', 'how-to', 'story'],
        topPerformingTopics: ['productivité', 'IA', 'mindset'],
        avoidTopics: ['crypto'],
        toneProfile: { formal: 0.2, humorous: 0.3, provocative: 0.3, educational: 0.7, inspirational: 0.5 },
        hookPatterns: [
          { pattern: 'Question rhétorique', example: 'Tu savais que 90% des gens...', avgEngagement: 4.1, timesUsed: 15 },
          { pattern: 'Chiffre choc', example: "J'ai gagné 10k€ en...", avgEngagement: 3.9, timesUsed: 12 },
          { pattern: 'Contre-intuition', example: 'Arrête de travailler dur', avgEngagement: 4.5, timesUsed: 6 },
        ],
        bestPostingTimes: [
          { dayOfWeek: 1, hourUTC: 18, avgEngagement: 4.3 },
          { dayOfWeek: 3, hourUTC: 12, avgEngagement: 4.0 },
          { dayOfWeek: 5, hourUTC: 17, avgEngagement: 3.9 },
        ],
        bestCTAs: [
          { text: 'Commente [mot] si tu veux la suite', position: 'end', avgConversion: 3.8 },
          { text: 'Enregistre ce post', position: 'middle', avgConversion: 2.9 },
        ],
        topHashtags: ['#business', '#motivation', '#entrepreneur', '#mindset', '#productivité'],
        avoidHashtags: ['#crypto', '#nft'],
      }),
    },
  });

  const v3 = await prisma.promptDNA.create({
    data: {
      version: 3,
      platform: null,
      category: 'SCRIPT',
      status: 'ACTIVE',
      confidence: 0.78,
      parentVersionId: v2.id,
      createdAt: daysAgo(15),
      activatedAt: daysAgo(15),
      promptTemplate: `Tu es le ghostwriter de TibTalks, un créateur business/tech qui cartonne.\nTu génères des scripts vidéo VIRAUX. Chaque mot compte.\n\nSTYLE TIBTALKS :\n- Hooks : TOUJOURS commencer par une "Contre-intuition" ou un "Chiffre choc"\n- Ton : Provocateur mais bienveillant.\n- PAS de blabla. Chaque phrase = une idée. Court. Punchy.\n- Structure : Hook (5s) → Contexte rapide (10s) → 3 points clés (30s) → Twist/Preuve (10s) → CTA engageant (5s)\n- Durée totale : 45-60 secondes MAX`,
      rules: JSON.stringify({
        optimalLength: { min: 45, max: 60, unit: 'seconds' },
        bestFormats: ['story', 'how-to', 'listicle', 'contre-intuition'],
        topPerformingTopics: ['IA', 'productivité', 'mindset', 'leadership'],
        avoidTopics: ['crypto', 'finance générale'],
        toneProfile: { formal: 0.1, humorous: 0.35, provocative: 0.45, educational: 0.65, inspirational: 0.6 },
        hookPatterns: [
          { pattern: 'Contre-intuition', example: 'Arrête de travailler dur. Sérieusement.', avgEngagement: 5.2, timesUsed: 14 },
          { pattern: 'Chiffre choc', example: '97% des entrepreneurs font cette erreur', avgEngagement: 4.8, timesUsed: 18 },
          { pattern: 'Question rhétorique', example: 'Tu bosses 12h/jour et t\'es toujours fauché ?', avgEngagement: 4.3, timesUsed: 22 },
          { pattern: 'Story personnelle', example: "J'ai perdu 50k€ à cause de ça...", avgEngagement: 5.0, timesUsed: 8 },
        ],
        bestPostingTimes: [
          { dayOfWeek: 1, hourUTC: 18, avgEngagement: 4.8 },
          { dayOfWeek: 2, hourUTC: 7, avgEngagement: 4.2 },
          { dayOfWeek: 3, hourUTC: 12, avgEngagement: 4.5 },
          { dayOfWeek: 5, hourUTC: 17, avgEngagement: 4.6 },
        ],
        bestCTAs: [
          { text: 'Commente "GUIDE" si tu veux le PDF complet', position: 'end', avgConversion: 5.1 },
          { text: 'Dis-moi en commentaire ton plus gros blocage', position: 'end', avgConversion: 4.2 },
          { text: 'Enregistre ce post, tu vas en avoir besoin', position: 'middle', avgConversion: 3.5 },
        ],
        topHashtags: ['#business', '#mindset', '#entrepreneur', '#productivité', '#IA', '#leadership'],
        avoidHashtags: ['#crypto', '#nft', '#forex'],
      }),
    },
  });

  const v4 = await prisma.promptDNA.create({
    data: {
      version: 4,
      platform: null,
      category: 'SCRIPT',
      status: 'TESTING',
      confidence: 0.82,
      parentVersionId: v3.id,
      createdAt: daysAgo(3),
      promptTemplate: `Tu es le ghostwriter de TibTalks. Tu écris des scripts VIRAUX pour les réseaux sociaux.\n\nIDENTITÉ TIBTALKS :\nUn mec normal qui a hacké le game. Pas de bullshit motivationnel. Du concret, des preuves.\n\nFORMULE (testée sur 127 posts) :\n1. HOOK (3-5s) : Contre-intuition OU Story personnelle\n2. TENSION (8-10s) : Poser le problème\n3. PAYLOAD (25-30s) : 3 bullets max\n4. PROOF (8-10s) : Chiffre perso, screenshot\n5. CTA (5s) : TOUJOURS interactif`,
      rules: JSON.stringify({
        optimalLength: { min: 45, max: 55, unit: 'seconds' },
        bestFormats: ['story', 'contre-intuition', 'how-to', 'listicle'],
        topPerformingTopics: ['IA pratique', 'hacks productivité', 'erreurs business', 'leadership moderne', 'mindset'],
        avoidTopics: ['crypto', 'finance théorique', 'lifestyle'],
        toneProfile: { formal: 0.05, humorous: 0.35, provocative: 0.45, educational: 0.65, inspirational: 0.6 },
        hookPatterns: [
          { pattern: 'Contre-intuition', example: 'Arrête de travailler dur. Sérieusement.', avgEngagement: 5.2, timesUsed: 18 },
          { pattern: 'Story personnelle', example: "J'ai perdu 50k€ à cause de ça...", avgEngagement: 5.0, timesUsed: 12 },
          { pattern: 'Chiffre choc', example: '97% des entrepreneurs font cette erreur', avgEngagement: 4.8, timesUsed: 22 },
          { pattern: 'Question rhétorique', example: 'Tu bosses 12h/jour et t\'es toujours fauché ?', avgEngagement: 4.3, timesUsed: 25 },
          { pattern: 'Polémique douce', example: 'Les morning routines c\'est du bullshit', avgEngagement: 4.9, timesUsed: 6 },
        ],
        bestPostingTimes: [
          { dayOfWeek: 1, hourUTC: 18, avgEngagement: 5.1 },
          { dayOfWeek: 2, hourUTC: 7, avgEngagement: 4.4 },
          { dayOfWeek: 3, hourUTC: 12, avgEngagement: 4.7 },
          { dayOfWeek: 4, hourUTC: 18, avgEngagement: 4.3 },
          { dayOfWeek: 5, hourUTC: 17, avgEngagement: 4.9 },
        ],
        bestCTAs: [
          { text: 'Commente "GUIDE" pour recevoir le PDF complet', position: 'end', avgConversion: 5.1 },
          { text: 'Dis-moi ton plus gros blocage en commentaire', position: 'end', avgConversion: 4.2 },
          { text: 'Enregistre ce post, tu vas en avoir besoin', position: 'middle', avgConversion: 3.5 },
          { text: 'Tag un pote qui a besoin de lire ça', position: 'end', avgConversion: 3.8 },
        ],
        topHashtags: ['#business', '#mindset', '#entrepreneur', '#productivité', '#IA', '#leadership', '#hustlesmarter'],
        avoidHashtags: ['#crypto', '#nft', '#forex', '#grindset'],
      }),
    },
  });

  // Mutations v1 → v2
  await prisma.promptMutation.createMany({
    data: [
      { promptDNAId: v2.id, mutationType: 'RULE_MODIFIED', beforeSnippet: 'optimalLength: { min: 60, max: 90 }', afterSnippet: 'optimalLength: { min: 45, max: 75 }', reason: 'Les posts de 45-75s ont un engagement 18% supérieur aux posts de 60-90s.', createdAt: daysAgo(40) },
      { promptDNAId: v2.id, mutationType: 'RULE_ADDED', beforeSnippet: null, afterSnippet: 'avoidTopics: ["crypto"]', reason: 'Les posts crypto sous-performent de 34% vs la moyenne.', createdAt: daysAgo(40) },
      { promptDNAId: v2.id, mutationType: 'HOOK_PATTERN_UPDATE', beforeSnippet: '2 patterns', afterSnippet: '3 patterns (+Contre-intuition)', reason: 'Le pattern Contre-intuition a 4.5% d\'engagement moyen.', createdAt: daysAgo(40) },
      { promptDNAId: v2.id, mutationType: 'TONE_SHIFT', beforeSnippet: 'provocative: 0.1', afterSnippet: 'provocative: 0.3', reason: 'Ton provocateur +22% engagement sur 40 posts.', createdAt: daysAgo(40) },
    ],
  });

  // Mutations v2 → v3
  await prisma.promptMutation.createMany({
    data: [
      { promptDNAId: v3.id, mutationType: 'RULE_MODIFIED', beforeSnippet: 'optimalLength: { min: 45, max: 75 }', afterSnippet: 'optimalLength: { min: 45, max: 60 }', reason: 'Vidéos <60s ont 31% plus de watch-through.', createdAt: daysAgo(15) },
      { promptDNAId: v3.id, mutationType: 'HOOK_PATTERN_UPDATE', beforeSnippet: 'Best: Question rhétorique (4.1%)', afterSnippet: 'Best: Contre-intuition (5.2%)', reason: 'Contre-intuition confirmée à 5.2% sur 14 posts.', createdAt: daysAgo(15) },
      { promptDNAId: v3.id, mutationType: 'FORMAT_CHANGE', beforeSnippet: 'Structure libre', afterSnippet: 'Hook→Contexte→3 points→Twist→CTA', reason: 'Structure 5 parties +27% engagement sur 50 posts.', createdAt: daysAgo(15) },
      { promptDNAId: v3.id, mutationType: 'RULE_ADDED', beforeSnippet: null, afterSnippet: 'topPerformingTopics: +leadership', reason: 'Leadership émerge à 4.7% engagement sur 6 posts.', createdAt: daysAgo(15) },
    ],
  });

  // Mutations v3 → v4
  await prisma.promptMutation.createMany({
    data: [
      { promptDNAId: v4.id, mutationType: 'RULE_MODIFIED', beforeSnippet: 'optimalLength: max 60', afterSnippet: 'optimalLength: max 55', reason: 'Posts 45-55s ont 8% retention en plus.', createdAt: daysAgo(3) },
      { promptDNAId: v4.id, mutationType: 'TONE_SHIFT', beforeSnippet: 'formal: 0.1', afterSnippet: 'formal: 0.05', reason: 'Mix provoc+humour +23% engagement vs sérieux.', createdAt: daysAgo(3) },
      { promptDNAId: v4.id, mutationType: 'HOOK_PATTERN_UPDATE', beforeSnippet: '4 patterns', afterSnippet: '5 patterns (+Polémique douce)', reason: 'Polémique douce: 4.9% engagement sur 6 posts.', createdAt: daysAgo(3) },
    ],
  });

  // Performance par version
  await prisma.promptPerformance.createMany({
    data: [
      { promptDNAId: v1.id, postsGenerated: 35, avgEngagementRate: 2.3, avgViews: 3200, avgLikes: 180, period: 'MONTH', measuredAt: daysAgo(45) },
      { promptDNAId: v2.id, postsGenerated: 42, avgEngagementRate: 3.1, avgViews: 5400, avgLikes: 320, period: 'MONTH', measuredAt: daysAgo(20) },
      { promptDNAId: v3.id, postsGenerated: 38, avgEngagementRate: 3.7, avgViews: 7200, avgLikes: 480, period: 'MONTH', measuredAt: daysAgo(5) },
      { promptDNAId: v4.id, postsGenerated: 8, avgEngagementRate: 4.1, avgViews: 8500, avgLikes: 560, period: 'WEEK', measuredAt: daysAgo(1) },
    ],
  });

  console.log('Created 4 Prompt DNA versions with mutations and performance');

  // AI Insights
  const posts = await prisma.post.findMany({ take: 10, orderBy: { publishedAt: 'desc' } });

  const insightsData = [
    { postId: posts[0]?.id, type: 'POST_ANALYSIS', content: JSON.stringify({ title: 'Post viral détecté', summary: 'Ce post a surperformé de 340% grâce à un hook contre-intuitif et un timing optimal (lundi 18h).', details: 'Taux de rétention de 78% sur les 3 premières secondes.', recommendations: ['Réutiliser ce type de hook', 'Poster plus souvent le lundi soir'] }), score: 92 },
    { type: 'TREND', content: JSON.stringify({ title: 'Tendance montante : IA pratique', summary: 'Les posts sur l\'IA appliquée au business ont un engagement en hausse de +45%.', details: 'Le sujet IA + productivité crée un combo performant.', recommendations: ['Augmenter la fréquence IA', 'Créer une série IA hack de la semaine'] }), score: 85 },
    { type: 'RECOMMENDATION', content: JSON.stringify({ title: 'Optimisation horaire détectée', summary: 'Le mardi matin (7h-8h) montre un potentiel inexploité.', details: '3 posts le mardi matin, tous au-dessus de la moyenne.', recommendations: ['Tester 5 posts le mardi matin', 'Contenu morning routine adapté'] }), score: 71 },
    { type: 'DNA_FUEL', content: JSON.stringify({ title: 'Mutation suggérée : nouveau hook', summary: 'Le pattern Polémique douce émerge avec 4.9% engagement.', details: 'Basé sur 6 posts récents.', recommendations: ['Intégrer au DNA v5', 'Tester sur TikTok et Instagram'] }), score: 88 },
    { postId: posts[3]?.id, type: 'POST_ANALYSIS', content: JSON.stringify({ title: 'Sous-performance identifiée', summary: 'Post LinkedIn sous-performé de 60%. Format liste longue inadapté.', details: 'Engagement chute après le 3ème point.', recommendations: ['Max 3 points sur LinkedIn', 'Storytelling perso'] }), score: 34 },
    { type: 'TREND', content: JSON.stringify({ title: 'TikTok : explosion des vues', summary: 'Vues TikTok +120% cette semaine. Format court favorisé.', details: 'Les 5 derniers TikToks > 10k vues. Format POV surperforme de 80%.', recommendations: ['Doubler la fréquence TikTok', 'Format POV prioritaire'] }), score: 90 },
  ];

  for (const insight of insightsData) {
    await prisma.aIInsight.create({ data: { ...insight, createdAt: daysAgo(randomInt(1, 7)) } });
  }

  console.log(`Created ${insightsData.length} AI insights`);
}

async function main() {
  console.log('Starting seed...');
  await prisma.contentBrainSync.deleteMany();
  await prisma.contentBrainExport.deleteMany();
  await prisma.promptPerformance.deleteMany();
  await prisma.promptMutation.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.postMetrics.deleteMany();
  await prisma.post.deleteMany();
  await prisma.promptDNA.deleteMany();

  await seedPosts();
  await seedPromptDNA();

  console.log('Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
