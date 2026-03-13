'use client';

import type { AIInsightData, InsightType } from '@/types/social';
import { Brain, TrendingUp, Lightbulb, Dna } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const typeConfig: Record<InsightType, { label: string; icon: typeof Brain; color: string; bg: string }> = {
  POST_ANALYSIS: { label: 'Analyse', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  TREND: { label: 'Tendance', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20' },
  RECOMMENDATION: { label: 'Reco', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  DNA_FUEL: { label: 'DNA', icon: Dna, color: 'text-violet-400', bg: 'bg-violet-500/20' },
};

interface Props {
  insights: AIInsightData[];
}

export function AIInsightsPanel({ insights }: Props) {
  const latest = insights.slice(0, 5);

  return (
    <div className="glass-card rounded-2xl p-5 h-full">
      <h3 className="text-white font-semibold mb-4">AI Insights</h3>
      <ScrollArea className="h-64">
        <div className="space-y-3">
          {latest.length === 0 && (
            <p className="text-white/30 text-sm text-center py-8">Aucun insight disponible</p>
          )}
          {latest.map((insight) => {
            const config = typeConfig[insight.type];
            const Icon = config.icon;
            const content = typeof insight.content === 'string'
              ? JSON.parse(insight.content)
              : insight.content;

            return (
              <div
                key={insight.id}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        insight.score >= 80 ? 'bg-green-500/20 text-green-400' :
                        insight.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {insight.score}
                      </span>
                    </div>
                    <p className="text-white text-xs font-medium mt-0.5">{content.title}</p>
                    <p className="text-white/40 text-[10px] mt-1 line-clamp-2">{content.summary}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
