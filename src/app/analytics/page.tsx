'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import type { AIInsightData, InsightType } from '@/types/social';
import { Brain, TrendingUp, Lightbulb, Dna, Sparkles, RefreshCw } from 'lucide-react';

const typeConfig: Record<InsightType, { label: string; icon: typeof Brain; color: string; bg: string }> = {
  POST_ANALYSIS: { label: 'Analyse Post', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  TREND: { label: 'Tendance', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20' },
  RECOMMENDATION: { label: 'Recommandation', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  DNA_FUEL: { label: 'DNA Fuel', icon: Dna, color: 'text-violet-400', bg: 'bg-violet-500/20' },
};

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<AIInsightData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<InsightType | 'ALL'>('ALL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchInsights = () => {
    setIsLoading(true);
    const params = filterType !== 'ALL' ? `?type=${filterType}` : '';
    fetch(`/api/analytics/insights${params}`)
      .then((r) => r.json())
      .then((data) => {
        setInsights(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchInsights();
  }, [filterType]);

  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await fetch('/api/analytics/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds: [] }),
      });
      fetchInsights();
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <Header />
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-violet-400" />
                AI Analytics
              </h1>
              <p className="text-white/40 text-sm mt-1">Insights générés par Claude AI</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as InsightType | 'ALL')}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="ALL">Tous types</option>
                <option value="POST_ANALYSIS">Analyses</option>
                <option value="TREND">Tendances</option>
                <option value="RECOMMENDATION">Recommandations</option>
                <option value="DNA_FUEL">DNA Fuel</option>
              </select>
              <button
                onClick={triggerAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                Analyser
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight) => {
                const config = typeConfig[insight.type];
                const Icon = config.icon;
                const content = typeof insight.content === 'string'
                  ? JSON.parse(insight.content)
                  : insight.content;

                return (
                  <div
                    key={insight.id}
                    className="glass-card rounded-xl p-5 hover:border-violet-500/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <span className={`text-xs font-medium ${config.color}`}>
                            {config.label}
                          </span>
                          <h3 className="text-white font-semibold text-sm">{content.title}</h3>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        insight.score >= 80 ? 'bg-green-500/20 text-green-400' :
                        insight.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {insight.score}
                      </div>
                    </div>

                    <p className="text-white/60 text-sm mb-3">{content.summary}</p>

                    {content.recommendations && content.recommendations.length > 0 && (
                      <div className="space-y-1.5">
                        {content.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-white/40">
                            <span className="text-violet-400 mt-0.5">→</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/30">
                      {new Date(insight.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
