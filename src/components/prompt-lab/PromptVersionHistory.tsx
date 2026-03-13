'use client';

import type { PromptDNAData } from '@/types/social';
import { cn } from '@/lib/utils';

interface Props {
  versions: PromptDNAData[];
  activeId: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500 border-green-400',
  TESTING: 'bg-yellow-500 border-yellow-400',
  DEPRECATED: 'bg-white/20 border-white/30',
  ROLLED_BACK: 'bg-red-500 border-red-400',
};

const statusGlow: Record<string, string> = {
  ACTIVE: 'shadow-[0_0_10px_rgba(34,197,94,0.4)]',
  TESTING: 'shadow-[0_0_10px_rgba(234,179,8,0.4)]',
};

export function PromptVersionHistory({ versions, activeId, selectedId, onSelect }: Props) {
  const sorted = [...versions].sort((a, b) => a.version - b.version);

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Version Timeline</h3>
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {sorted.map((v, i) => {
          const isActive = v.id === activeId;
          const isSelected = v.id === selectedId;
          const color = statusColors[v.status] ?? 'bg-white/20 border-white/30';
          const glow = statusGlow[v.status] ?? '';

          return (
            <div key={v.id} className="flex items-center">
              {/* Dot */}
              <button
                onClick={() => onSelect(v.id)}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-all cursor-pointer',
                    color,
                    glow,
                    isSelected && 'ring-2 ring-violet-400 ring-offset-2 ring-offset-[#0A0A0F]',
                    isActive && 'pulse-glow',
                    'group-hover:scale-125'
                  )}
                />
                <div className="text-center">
                  <p className={cn(
                    'text-xs font-medium',
                    isSelected ? 'text-white' : 'text-white/40'
                  )}>
                    v{v.version}
                  </p>
                  <p className="text-[9px] text-white/20">
                    {new Date(v.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </button>

              {/* Line connector */}
              {i < sorted.length - 1 && (
                <div className="w-12 h-0.5 bg-white/10 mx-2 mt-[-20px]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
