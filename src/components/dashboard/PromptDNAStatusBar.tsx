'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Dna, ArrowRight, Zap } from 'lucide-react';
import type { PromptDNAData } from '@/types/social';

export function PromptDNAStatusBar() {
  const [activeDNA, setActiveDNA] = useState<PromptDNAData | null>(null);

  useEffect(() => {
    fetch('/api/prompt-dna/history')
      .then((r) => r.json())
      .then((data) => {
        const active = data.find((v: PromptDNAData) => v.status === 'ACTIVE');
        if (active) setActiveDNA(active);
      })
      .catch(() => {});
  }, []);

  if (!activeDNA) return null;

  const latestMutation = activeDNA.mutations?.[0];

  return (
    <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
          <Dna className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">Prompt DNA</span>
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              v{activeDNA.version} Active
            </span>
          </div>
          <p className="text-white/40 text-xs mt-0.5">
            Confidence: {Math.round(activeDNA.confidence * 100)}%
            {latestMutation && (
              <span className="ml-3">
                Dernière mutation: {latestMutation.reason.slice(0, 60)}...
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-violet-400 text-xs">
          <Zap className="w-3.5 h-3.5" />
          <span>Score: {activeDNA.performances?.[0]?.avgEngagementRate?.toFixed(1) ?? '—'}%</span>
        </div>
        <Link
          href="/prompt-lab"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/20 to-blue-500/20 border border-violet-500/20 text-white text-xs font-medium hover:from-violet-500/30 hover:to-blue-500/30 transition-all"
        >
          Voir le labo
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
