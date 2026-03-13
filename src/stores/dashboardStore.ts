import { create } from 'zustand';
import type { PostWithMetrics, KPIData, PlatformStats, HeatmapCell, AIInsightData, Platform } from '@/types/social';

export type Period = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

interface DashboardState {
  posts: PostWithMetrics[];
  kpis: KPIData[];
  platformStats: PlatformStats[];
  heatmapData: HeatmapCell[];
  insights: AIInsightData[];
  selectedPlatform: Platform | 'ALL';
  selectedPeriod: Period;
  customDateRange: { from: string; to: string } | null;
  selectedPost: PostWithMetrics | null;
  isLoading: boolean;
  fetchDashboardData: () => Promise<void>;
  setSelectedPlatform: (platform: Platform | 'ALL') => void;
  setSelectedPeriod: (period: Period) => void;
  setCustomDateRange: (from: string, to: string) => void;
  setSelectedPost: (post: PostWithMetrics | null) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  posts: [],
  kpis: [],
  platformStats: [],
  heatmapData: [],
  insights: [],
  selectedPlatform: 'ALL',
  selectedPeriod: 'all',
  customDateRange: null,
  selectedPost: null,
  isLoading: false,

  fetchDashboardData: async () => {
    set({ isLoading: true });
    try {
      const { selectedPlatform, selectedPeriod, customDateRange } = get();
      const params = new URLSearchParams();
      if (selectedPlatform !== 'ALL') params.set('platform', selectedPlatform);
      if (selectedPeriod === 'custom' && customDateRange) {
        params.set('from', customDateRange.from);
        params.set('to', customDateRange.to);
      } else if (selectedPeriod !== 'all') {
        params.set('period', selectedPeriod);
      }
      const qs = params.toString();
      const res = await fetch(`/api/dashboard${qs ? `?${qs}` : ''}`);
      const data = await res.json();
      set({
        posts: data.posts ?? [],
        kpis: data.kpis ?? [],
        platformStats: data.platformStats ?? [],
        heatmapData: data.heatmapData ?? [],
        insights: data.insights ?? [],
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setSelectedPlatform: (platform) => {
    set({ selectedPlatform: platform });
    get().fetchDashboardData();
  },

  setSelectedPeriod: (period) => {
    if (period !== 'custom') set({ customDateRange: null });
    set({ selectedPeriod: period });
    get().fetchDashboardData();
  },

  setCustomDateRange: (from, to) => {
    set({ selectedPeriod: 'custom', customDateRange: { from, to } });
    get().fetchDashboardData();
  },

  setSelectedPost: (post) => {
    set({ selectedPost: post });
  },
}));
