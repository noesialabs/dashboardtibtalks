'use client';

import { useDashboardStore } from '@/stores/dashboardStore';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/types/social';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Eye, Heart, MessageCircle, Share2, Bookmark, TrendingUp,
  ExternalLink, Calendar, Film, Image as ImageIcon, Type, Layers,
  FileText, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('fr-FR');
}

const mediaTypeIcons: Record<string, typeof Film> = {
  VIDEO: Film,
  IMAGE: ImageIcon,
  TEXT: Type,
  CAROUSEL: Layers,
};

const mediaTypeLabels: Record<string, string> = {
  VIDEO: 'Video',
  IMAGE: 'Image',
  TEXT: 'Texte',
  CAROUSEL: 'Carousel',
};

export function PostDetailModal() {
  const { selectedPost, setSelectedPost } = useDashboardStore();
  const [imgError, setImgError] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  if (!selectedPost) return null;

  const post = selectedPost;
  const m = post.metrics;
  const MediaIcon = mediaTypeIcons[post.mediaType] || Film;
  const platformColor = PLATFORM_COLORS[post.platform];

  const metrics = [
    { icon: Eye, label: 'Vues', value: m.views, color: 'text-blue-400' },
    { icon: Heart, label: 'Likes', value: m.likes, color: 'text-pink-400' },
    { icon: MessageCircle, label: 'Commentaires', value: m.comments, color: 'text-yellow-400' },
    { icon: Share2, label: 'Partages', value: m.shares, color: 'text-green-400' },
    { icon: Bookmark, label: 'Saves', value: m.saves, color: 'text-purple-400' },
    { icon: TrendingUp, label: 'Engagement', value: m.engagementRate, color: 'text-violet-400', isPercent: true },
  ];

  return (
    <Dialog open={!!selectedPost} onOpenChange={(open) => { if (!open) { setSelectedPost(null); setImgError(false); setShowFullTranscript(false); } }}>
      <DialogContent className="bg-[#12121A] border-white/10 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              className="text-xs font-bold"
              style={{
                backgroundColor: platformColor + '20',
                color: platformColor,
                borderColor: platformColor + '40',
              }}
            >
              {PLATFORM_NAMES[post.platform]}
            </Badge>
            <Badge variant="outline" className="text-xs text-white/50 border-white/10 gap-1">
              <MediaIcon className="w-3 h-3" />
              {mediaTypeLabels[post.mediaType]}
            </Badge>
            <span className="text-white/30 text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>
          <DialogTitle className="text-lg font-bold text-white leading-tight">
            {post.title || 'Sans titre'}
          </DialogTitle>
        </DialogHeader>

        {/* Thumbnail */}
        {post.thumbnailUrl && !imgError && (
          <div className="w-full rounded-xl overflow-hidden bg-white/5 aspect-video">
            <img
              src={post.thumbnailUrl}
              alt={post.title || ''}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Content */}
        {post.content && post.content !== post.title && (
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/70 text-sm whitespace-pre-line leading-relaxed">
              {post.content.length > 500 ? post.content.slice(0, 500) + '...' : post.content}
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.map(({ icon: Icon, label, value, color, isPercent }) => (
            <div key={label} className="bg-white/5 rounded-xl p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
              <p className="text-white text-xl font-bold">
                {isPercent ? `${(value as number).toFixed(2)}%` : formatNumber(value as number)}
              </p>
              <p className="text-white/40 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Transcript */}
        {post.transcript && (
          <div className="bg-white/5 rounded-xl p-4">
            <button
              onClick={() => setShowFullTranscript(!showFullTranscript)}
              className="flex items-center gap-2 text-sm font-medium text-white mb-2 w-full"
            >
              <FileText className="w-4 h-4 text-violet-400" />
              Transcript
              <span className="text-white/30 text-xs ml-auto">
                {post.transcript.length.toLocaleString('fr-FR')} car.
              </span>
              {showFullTranscript
                ? <ChevronUp className="w-4 h-4 text-white/40" />
                : <ChevronDown className="w-4 h-4 text-white/40" />
              }
            </button>
            <p className="text-white/60 text-xs leading-relaxed whitespace-pre-line">
              {showFullTranscript
                ? post.transcript
                : post.transcript.slice(0, 300) + (post.transcript.length > 300 ? '...' : '')
              }
            </p>
          </div>
        )}

        {/* Link to original post */}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: platformColor + '20',
              color: platformColor,
            }}
          >
            <ExternalLink className="w-4 h-4" />
            Voir sur {PLATFORM_NAMES[post.platform]}
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
