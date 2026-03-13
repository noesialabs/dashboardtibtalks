'use client';

import { useState } from 'react';
import type { PostWithMetrics } from '@/types/social';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/types/social';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Eye, Heart, MessageCircle, TrendingUp, Trophy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

type SortMode = 'engagement' | 'views' | 'likes';

const sortModes: { value: SortMode; label: string; icon: typeof TrendingUp }[] = [
  { value: 'views', label: 'Vues', icon: Eye },
  { value: 'likes', label: 'Likes', icon: Heart },
  { value: 'engagement', label: 'Engage.', icon: TrendingUp },
];

interface Props {
  posts: PostWithMetrics[];
}

export function TopPostsRanking({ posts }: Props) {
  const [sortBy, setSortBy] = useState<SortMode>('views');
  const { setSelectedPost } = useDashboardStore();
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const topPosts = [...posts]
    .sort((a, b) => {
      if (sortBy === 'views') return b.metrics.views - a.metrics.views;
      if (sortBy === 'likes') return b.metrics.likes - a.metrics.likes;
      return b.metrics.engagementRate - a.metrics.engagementRate;
    })
    .slice(0, 10);

  return (
    <div className="glass-card rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Top Posts
        </h3>
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
          {sortModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.value}
                onClick={() => setSortBy(mode.value)}
                title={`Trier par ${mode.label}`}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 ${
                  sortBy === mode.value
                    ? 'bg-violet-500/30 text-violet-300'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Icon className="w-3 h-3" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2">
          {topPosts.map((post, i) => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="w-full text-left flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] hover:border-violet-500/20 border border-transparent transition-all cursor-pointer"
            >
              <div className={`font-bold text-lg w-6 text-center flex-shrink-0 ${
                i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/20'
              }`}>
                {i + 1}
              </div>
              {post.thumbnailUrl && !imgErrors.has(post.id) ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                  <img
                    src={post.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImgErrors(prev => new Set(prev).add(post.id))}
                  />
                </div>
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: PLATFORM_COLORS[post.platform] + '20', color: PLATFORM_COLORS[post.platform] }}
                >
                  {PLATFORM_NAMES[post.platform].slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: PLATFORM_COLORS[post.platform] + '20',
                      color: PLATFORM_COLORS[post.platform],
                    }}
                  >
                    {PLATFORM_NAMES[post.platform]}
                  </span>
                </div>
                <p className="text-white text-xs font-medium truncate">{post.title || 'Sans titre'}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/40">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {formatNumber(post.metrics.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {formatNumber(post.metrics.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> {formatNumber(post.metrics.comments)}
                  </span>
                  <span className="text-violet-400 font-bold">
                    {post.metrics.engagementRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
