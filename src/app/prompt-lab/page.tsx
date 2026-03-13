'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PromptDNAViewer } from '@/components/prompt-lab/PromptDNAViewer';
import { PromptVersionHistory } from '@/components/prompt-lab/PromptVersionHistory';
import { PromptDiffView } from '@/components/prompt-lab/PromptDiffView';
import { PromptPerformanceChart } from '@/components/prompt-lab/PromptPerformanceChart';
import { MutationLog } from '@/components/prompt-lab/MutationLog';
import { usePromptDNAStore } from '@/stores/promptDNAStore';
import { Dna, RefreshCw, Upload, RotateCcw, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PromptLabPage() {
  const {
    versions,
    activeVersion,
    selectedVersion,
    compareVersion,
    isLoading,
    fetchVersions,
    setSelectedVersion,
    setCompareVersion,
    triggerMutation,
    rollback,
  } = usePromptDNAStore();

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const allMutations = versions
    .flatMap((v) => v.mutations.map((m) => ({ ...m, version: v.version })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export/content-brain', { method: 'POST' });
      const data = await res.json();
      // Télécharger en JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-dna-v${activeVersion?.version ?? 0}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <Header />
        <div className="p-4 lg:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                <Dna className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Prompt Lab</h1>
                <p className="text-white/40 text-sm">TibTalks Content DNA — Système auto-apprenant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerMutation()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition-all"
              >
                <Zap className="w-4 h-4" />
                Forcer mutation
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all"
              >
                <Upload className="w-4 h-4" />
                Exporter
              </button>
              {selectedVersion && selectedVersion.id !== activeVersion?.id && (
                <button
                  onClick={() => rollback(selectedVersion.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Rollback
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Version Timeline */}
              <PromptVersionHistory
                versions={versions}
                activeId={activeVersion?.id ?? null}
                selectedId={selectedVersion?.id ?? null}
                onSelect={(id) => {
                  const v = versions.find((v) => v.id === id);
                  if (v) setSelectedVersion(v);
                }}
              />

              {/* Main content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* DNA Viewer */}
                <PromptDNAViewer dna={selectedVersion ?? activeVersion} />

                {/* Mutations */}
                <MutationLog mutations={allMutations} />
              </div>

              {/* Performance chart */}
              <PromptPerformanceChart versions={versions} />

              {/* Diff viewer */}
              {compareVersion && (
                <PromptDiffView
                  versionA={selectedVersion ?? activeVersion}
                  versionB={compareVersion}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
