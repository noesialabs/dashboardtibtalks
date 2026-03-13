'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PostDetailModal } from '@/components/dashboard/PostDetailModal';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStore } from '@/stores/dashboardStore';
import type { PostWithMetrics } from '@/types/social';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/types/social';
import { Eye, Heart, MessageCircle, Share2, Bookmark, Calendar, FileText } from 'lucide-react';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function PostsPage() {
  const { posts, isLoading, fetchDashboardData, selectedPlatform, setSelectedPost } = useDashboardStore();
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes' | 'engagement'>('date');
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (posts.length === 0) fetchDashboardData();
  }, [posts.length, fetchDashboardData]);

  const sorted = [...posts].sort((a, b) => {
    if (sortBy === 'views') return b.metrics.views - a.metrics.views;
    if (sortBy === 'likes') return b.metrics.likes - a.metrics.likes;
    if (sortBy === 'engagement') return b.metrics.engagementRate - a.metrics.engagementRate;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const platformLabel = selectedPlatform === 'ALL' ? 'toutes les plateformes' : PLATFORM_NAMES[selectedPlatform];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <Header />
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Posts</h1>
              <p className="text-white/40 text-sm mt-1">
                {sorted.length} posts sur {platformLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="date">Plus récents</option>
                <option value="views">Plus vus</option>
                <option value="likes">Plus likés</option>
                <option value="engagement">Meilleur engagement</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="w-full text-left glass-card rounded-xl p-4 flex items-start gap-4 hover:border-violet-500/20 border border-transparent transition-all cursor-pointer"
                >
                  {/* Thumbnail */}
                  {post.thumbnailUrl && !imgErrors.has(post.id) ? (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                      <img
                        src={post.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => setImgErrors(prev => new Set(prev).add(post.id))}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: PLATFORM_COLORS[post.platform] + '15', color: PLATFORM_COLORS[post.platform] }}
                    >
                      {PLATFORM_NAMES[post.platform].slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: PLATFORM_COLORS[post.platform] + '20',
                          color: PLATFORM_COLORS[post.platform],
                          borderColor: PLATFORM_COLORS[post.platform] + '40',
                        }}
                      >
                        {PLATFORM_NAMES[post.platform]}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-white/50 border-white/10">
                        {post.mediaType}
                      </Badge>
                      <span className="text-white/30 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.publishedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium text-sm truncate">{post.title || 'Sans titre'}</h3>
                      {post.transcript && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 text-[10px] font-medium flex-shrink-0">
                          <FileText className="w-3 h-3" />
                          Transcript
                        </span>
                      )}
                    </div>
                    {post.content && post.content !== post.title && (
                      <p className="text-white/40 text-xs mt-1 truncate">{post.content}</p>
                    )}
                    {post.transcript && (
                      <p className="text-white/30 text-xs mt-1 truncate italic">
                        &quot;{post.transcript.slice(0, 120)}...&quot;
                      </p>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 flex-shrink-0 text-xs text-white/60">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{formatNumber(post.metrics.views)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span>{formatNumber(post.metrics.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{formatNumber(post.metrics.comments)}</span>
                    </div>
                    {post.metrics.shares > 0 && (
                      <div className="flex items-center gap-1">
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{formatNumber(post.metrics.shares)}</span>
                      </div>
                    )}
                    {post.metrics.saves > 0 && (
                      <div className="flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{formatNumber(post.metrics.saves)}</span>
                      </div>
                    )}
                    <div className="px-2 py-1 rounded-lg bg-violet-500/20 text-violet-400 font-medium">
                      {post.metrics.engagementRate.toFixed(1)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <PostDetailModal />
      </main>
    </div>
  );
}
