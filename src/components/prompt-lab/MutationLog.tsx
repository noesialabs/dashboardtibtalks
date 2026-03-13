'use client';

import type { PromptMutationData, MutationType } from '@/types/social';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, RefreshCw, Music, Layout, Zap } from 'lucide-react';

const mutationConfig: Record<MutationType, { icon: typeof Plus; color: string; bg: string; label: string }> = {
  RULE_ADDED: { icon: Plus, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Ajout' },
  RULE_REMOVED: { icon: Minus, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Suppression' },
  RULE_MODIFIED: { icon: RefreshCw, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Modification' },
  TONE_SHIFT: { icon: Music, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Ton' },
  FORMAT_CHANGE: { icon: Layout, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Format' },
  HOOK_PATTERN_UPDATE: { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Hook' },
};

interface MutationWithVersion extends PromptMutationData {
  version?: number;
}

interface Props {
  mutations: MutationWithVersion[];
}

export function MutationLog({ mutations }: Props) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-4">Journal des Mutations</h3>
      <ScrollArea className="h-[500px]">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />

          <div className="space-y-4">
            {mutations.map((mutation) => {
              const config = mutationConfig[mutation.mutationType as MutationType] ?? mutationConfig.RULE_MODIFIED;
              const Icon = config.icon;

              return (
                <div key={mutation.id} className="flex gap-3 ml-0.5">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 z-10`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white/[0.02] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-medium ${config.color}`}>
                        {config.label}
                        {mutation.version && (
                          <span className="text-white/20 ml-2">v{mutation.version}</span>
                        )}
                      </span>
                      <span className="text-[10px] text-white/20">
                        {new Date(mutation.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <p className="text-white/70 text-xs mb-2">{mutation.reason}</p>

                    {(mutation.beforeSnippet || mutation.afterSnippet) && (
                      <div className="space-y-1 text-[10px] font-mono">
                        {mutation.beforeSnippet && (
                          <div className="bg-red-500/10 rounded px-2 py-1 text-red-400">
                            - {mutation.beforeSnippet}
                          </div>
                        )}
                        {mutation.afterSnippet && (
                          <div className="bg-green-500/10 rounded px-2 py-1 text-green-400">
                            + {mutation.afterSnippet}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
