'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { KPICards } from '@/components/dashboard/KPICards';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { TopPostsRanking } from '@/components/dashboard/TopPostsRanking';
import { PlatformComparison } from '@/components/dashboard/PlatformComparison';
import { EngagementHeatmap } from '@/components/dashboard/EngagementHeatmap';
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel';
import { PromptDNAStatusBar } from '@/components/dashboard/PromptDNAStatusBar';
import { PostDetailModal } from '@/components/dashboard/PostDetailModal';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function DashboardPage() {
  const {
    kpis,
    posts,
    platformStats,
    heatmapData,
    insights,
    selectedPlatform,
    isLoading,
    fetchDashboardData,
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <Header />
        <div className="p-4 lg:p-6 space-y-6">
          {/* KPI Cards */}
          <KPICards kpis={kpis} isLoading={isLoading} />

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PerformanceChart posts={posts} selectedPlatform={selectedPlatform} />
            </div>
            <div>
              <TopPostsRanking posts={posts} />
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <PlatformComparison stats={platformStats} />
            </div>
            <div>
              <EngagementHeatmap data={heatmapData} />
            </div>
            <div>
              <AIInsightsPanel insights={insights} />
            </div>
          </div>

          {/* Prompt DNA Status Bar */}
          <PromptDNAStatusBar />
        </div>

        {/* Post detail modal */}
        <PostDetailModal />
      </main>
    </div>
  );
}
