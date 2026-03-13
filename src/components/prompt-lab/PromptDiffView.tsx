'use client';

import type { PromptDNAData, PromptDNARules } from '@/types/social';

interface Props {
  versionA: PromptDNAData | null;
  versionB: PromptDNAData | null;
}

function flattenRules(rules: PromptDNARules): Record<string, string> {
  const flat: Record<string, string> = {};
  flat['Durée optimale'] = `${rules.optimalLength.min}–${rules.optimalLength.max} ${rules.optimalLength.unit}`;
  flat['Formats'] = rules.bestFormats.join(', ');
  flat['Sujets top'] = rules.topPerformingTopics.join(', ');
  flat['Sujets à éviter'] = rules.avoidTopics.join(', ') || '—';
  flat['Ton formel'] = (rules.toneProfile.formal * 100).toFixed(0) + '%';
  flat['Ton humour'] = (rules.toneProfile.humorous * 100).toFixed(0) + '%';
  flat['Ton provocateur'] = (rules.toneProfile.provocative * 100).toFixed(0) + '%';
  flat['Ton éducatif'] = (rules.toneProfile.educational * 100).toFixed(0) + '%';
  flat['Ton inspirant'] = (rules.toneProfile.inspirational * 100).toFixed(0) + '%';
  flat['Hooks'] = rules.hookPatterns.map((h) => h.pattern).join(', ');
  flat['CTAs'] = rules.bestCTAs.map((c) => c.text).join(' | ');
  flat['Hashtags'] = rules.topHashtags.join(', ');
  flat['Hashtags à éviter'] = rules.avoidHashtags.join(', ') || '—';
  return flat;
}

export function PromptDiffView({ versionA, versionB }: Props) {
  if (!versionA || !versionB) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-white/30 text-sm">
        Sélectionnez deux versions pour comparer
      </div>
    );
  }

  const rulesA = typeof versionA.rules === 'string' ? JSON.parse(versionA.rules) : versionA.rules;
  const rulesB = typeof versionB.rules === 'string' ? JSON.parse(versionB.rules) : versionB.rules;
  const flatA = flattenRules(rulesA);
  const flatB = flattenRules(rulesB);

  const allKeys = [...new Set([...Object.keys(flatA), ...Object.keys(flatB)])];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-4">
        Diff: v{versionA.version} ↔ v{versionB.version}
      </h3>
      <div className="space-y-2">
        {allKeys.map((key) => {
          const a = flatA[key] ?? '—';
          const b = flatB[key] ?? '—';
          const changed = a !== b;

          return (
            <div
              key={key}
              className={`grid grid-cols-[140px,1fr,1fr] gap-3 p-2 rounded-lg text-xs ${
                changed ? 'bg-violet-500/5' : ''
              }`}
            >
              <span className="text-white/40 font-medium">{key}</span>
              <span className={changed ? 'text-red-400 line-through' : 'text-white/50'}>
                {a}
              </span>
              <span className={changed ? 'text-green-400' : 'text-white/50'}>
                {b}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
