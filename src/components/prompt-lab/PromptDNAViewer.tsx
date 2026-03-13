'use client';

import type { PromptDNAData, PromptDNARules } from '@/types/social';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  dna: PromptDNAData | null;
}

export function PromptDNAViewer({ dna }: Props) {
  if (!dna) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center justify-center h-96">
        <p className="text-white/30 text-sm">Sélectionnez une version</p>
      </div>
    );
  }

  const rules: PromptDNARules = typeof dna.rules === 'string' ? JSON.parse(dna.rules) : dna.rules;

  const toneData = [
    { trait: 'Formel', value: rules.toneProfile.formal * 100 },
    { trait: 'Humour', value: rules.toneProfile.humorous * 100 },
    { trait: 'Provocateur', value: rules.toneProfile.provocative * 100 },
    { trait: 'Éducatif', value: rules.toneProfile.educational * 100 },
    { trait: 'Inspirant', value: rules.toneProfile.inspirational * 100 },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">DNA v{dna.version}</h3>
        <Badge className={`text-xs ${
          dna.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
          dna.status === 'TESTING' ? 'bg-yellow-500/20 text-yellow-400' :
          dna.status === 'ROLLED_BACK' ? 'bg-red-500/20 text-red-400' :
          'bg-white/10 text-white/40'
        }`}>
          {dna.status}
        </Badge>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-5">
          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/50 text-xs">Confidence</span>
              <span className="text-white text-xs font-medium">{Math.round(dna.confidence * 100)}%</span>
            </div>
            <Progress value={dna.confidence * 100} className="h-2" />
          </div>

          {/* Tone Profile - Radar */}
          <div>
            <h4 className="text-white/60 text-xs font-medium mb-2">Profil de ton</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={toneData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="trait"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  />
                  <Radar
                    dataKey="value"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hook Patterns */}
          <div>
            <h4 className="text-white/60 text-xs font-medium mb-2">Hook Patterns</h4>
            <div className="space-y-2">
              {rules.hookPatterns.map((hook) => (
                <div key={hook.pattern} className="bg-white/[0.03] rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-medium">{hook.pattern}</span>
                    <span className="text-violet-400 text-xs font-bold">{hook.avgEngagement}%</span>
                  </div>
                  <p className="text-white/30 text-[10px] mt-1">&ldquo;{hook.example}&rdquo;</p>
                  <span className="text-white/20 text-[10px]">{hook.timesUsed} utilisations</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best Formats */}
          <div>
            <h4 className="text-white/60 text-xs font-medium mb-2">Formats</h4>
            <div className="flex flex-wrap gap-1.5">
              {rules.bestFormats.map((f) => (
                <Badge key={f} className="bg-violet-500/20 text-violet-400 text-[10px]">{f}</Badge>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div>
            <h4 className="text-white/60 text-xs font-medium mb-2">Sujets performants</h4>
            <div className="flex flex-wrap gap-1.5">
              {rules.topPerformingTopics.map((t) => (
                <Badge key={t} className="bg-green-500/20 text-green-400 text-[10px]">{t}</Badge>
              ))}
            </div>
            {rules.avoidTopics.length > 0 && (
              <>
                <h4 className="text-white/60 text-xs font-medium mb-2 mt-3">Sujets à éviter</h4>
                <div className="flex flex-wrap gap-1.5">
                  {rules.avoidTopics.map((t) => (
                    <Badge key={t} className="bg-red-500/20 text-red-400 text-[10px]">{t}</Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Best CTAs */}
          <div>
            <h4 className="text-white/60 text-xs font-medium mb-2">CTAs champions</h4>
            <div className="space-y-1.5">
              {rules.bestCTAs.map((cta, i) => (
                <div key={i} className="bg-white/[0.03] rounded-lg p-2 flex items-center justify-between">
                  <span className="text-white/70 text-[10px]">&ldquo;{cta.text}&rdquo;</span>
                  <span className="text-blue-400 text-[10px] font-bold">{cta.avgConversion}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <h4 className="text-white/60 text-xs font-medium mb-2">Hashtags</h4>
            <div className="flex flex-wrap gap-1.5">
              {rules.topHashtags.map((h) => (
                <Badge key={h} className="bg-blue-500/20 text-blue-400 text-[10px]">{h}</Badge>
              ))}
            </div>
          </div>

          {/* Optimal Length */}
          <div className="bg-white/[0.03] rounded-lg p-3">
            <span className="text-white/50 text-xs">Durée optimale:</span>
            <span className="text-white text-xs font-medium ml-2">
              {rules.optimalLength.min}–{rules.optimalLength.max} {rules.optimalLength.unit}
            </span>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
