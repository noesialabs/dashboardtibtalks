// Types pour le dashboard social media TibTalks

export type Platform = 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'LINKEDIN';
export type MediaType = 'VIDEO' | 'IMAGE' | 'TEXT' | 'CAROUSEL';
export type InsightType = 'POST_ANALYSIS' | 'TREND' | 'RECOMMENDATION' | 'DNA_FUEL';
export type PromptDNAStatus = 'ACTIVE' | 'TESTING' | 'DEPRECATED' | 'ROLLED_BACK';
export type PromptCategory = 'SCRIPT' | 'POST_CAPTION' | 'HOOK' | 'CTA' | 'HASHTAGS';
export type MutationType = 'RULE_ADDED' | 'RULE_REMOVED' | 'RULE_MODIFIED' | 'TONE_SHIFT' | 'FORMAT_CHANGE' | 'HOOK_PATTERN_UPDATE';

export interface PostWithMetrics {
  id: string;
  platformId: string;
  platform: Platform;
  title: string | null;
  content: string | null;
  mediaType: MediaType;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
  url: string | null;
  transcript: string | null;
  metrics: MetricsData;
  aiScore?: number;
}

export interface MetricsData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
}

export interface KPIData {
  label: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

export interface PlatformStats {
  platform: Platform;
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  avgEngagement: number;
  color: string;
}

export interface HeatmapCell {
  day: number; // 0-6 (lundi-dimanche)
  hour: number; // 0-23
  value: number;
}

export interface PromptDNARules {
  optimalLength: { min: number; max: number; unit: 'words' | 'seconds' };
  bestFormats: string[];
  topPerformingTopics: string[];
  avoidTopics: string[];
  toneProfile: {
    formal: number;
    humorous: number;
    provocative: number;
    educational: number;
    inspirational: number;
  };
  hookPatterns: {
    pattern: string;
    example: string;
    avgEngagement: number;
    timesUsed: number;
  }[];
  bestPostingTimes: {
    dayOfWeek: number;
    hourUTC: number;
    avgEngagement: number;
  }[];
  bestCTAs: {
    text: string;
    position: 'start' | 'middle' | 'end';
    avgConversion: number;
  }[];
  topHashtags: string[];
  avoidHashtags: string[];
}

export interface PromptDNAData {
  id: string;
  version: number;
  platform: Platform | null;
  category: PromptCategory;
  promptTemplate: string;
  rules: PromptDNARules;
  confidence: number;
  status: PromptDNAStatus;
  parentVersionId: string | null;
  createdAt: string;
  activatedAt: string | null;
  performances: PromptPerformanceData[];
  mutations: PromptMutationData[];
}

export interface PromptMutationData {
  id: string;
  mutationType: MutationType;
  beforeSnippet: string | null;
  afterSnippet: string | null;
  reason: string;
  createdAt: string;
}

export interface PromptPerformanceData {
  id: string;
  postsGenerated: number;
  avgEngagementRate: number;
  avgViews: number;
  avgLikes: number;
  period: string;
  measuredAt: string;
}

export interface AIInsightData {
  id: string;
  type: InsightType;
  content: {
    title: string;
    summary: string;
    details: string;
    recommendations?: string[];
    score?: number;
  };
  score: number;
  postId?: string;
  createdAt: string;
}

// Couleurs par plateforme
export const PLATFORM_COLORS: Record<Platform, string> = {
  INSTAGRAM: '#E4405F',
  TIKTOK: '#00F2EA',
  YOUTUBE: '#FF0000',
  LINKEDIN: '#0A66C2',
};

export const PLATFORM_NAMES: Record<Platform, string> = {
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
  LINKEDIN: 'LinkedIn',
};
