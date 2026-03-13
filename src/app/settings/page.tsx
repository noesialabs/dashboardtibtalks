'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PostDetailModal } from '@/components/dashboard/PostDetailModal';
import { Settings, Key, Globe, Database, RefreshCw, Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fetchResult, setFetchResult] = useState<string>('');
  const [transcriptStatus, setTranscriptStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [transcriptResult, setTranscriptResult] = useState<string>('');

  async function handleFetchData() {
    setFetchStatus('loading');
    setFetchResult('Lancement du fetch Apify (peut prendre plusieurs minutes)...');
    try {
      const res = await fetch('/api/social/fetch', { method: 'POST' });
      const data = await res.json();
      setFetchStatus(data.success ? 'success' : 'error');
      const summary = data.results
        ? Object.entries(data.results).map(([k, v]: [string, unknown]) => {
            const r = v as { inserted: number; updated: number; errors: string[] };
            return `${k}: ${r.inserted} nouveaux, ${r.updated} mis a jour`;
          }).join(' | ')
        : '';
      setFetchResult(summary + (data.errors?.length ? ` | Erreurs: ${data.errors.join(', ')}` : ''));
    } catch (e) {
      setFetchStatus('error');
      setFetchResult(e instanceof Error ? e.message : 'Erreur inconnue');
    }
  }

  async function handleFetchTranscripts() {
    setTranscriptStatus('loading');
    setTranscriptResult('Recuperation des transcripts YouTube + TikTok...');
    try {
      const res = await fetch('/api/social/transcripts', { method: 'POST' });
      const data = await res.json();
      setTranscriptStatus(data.success ? 'success' : 'error');
      const summary = data.results
        ? Object.entries(data.results).map(([k, v]: [string, unknown]) => {
            const r = v as { requested: number; updated: number };
            return `${k}: ${r.updated}/${r.requested} transcrits`;
          }).join(' | ')
        : `${data.summary?.totalUpdated || 0} transcrits`;
      setTranscriptResult(summary + (data.errors?.length ? ` | Erreurs: ${data.errors.join(', ')}` : ''));
    } catch (e) {
      setTranscriptStatus('error');
      setTranscriptResult(e instanceof Error ? e.message : 'Erreur inconnue');
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <Header />
        <div className="p-4 lg:p-6 space-y-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-white/60" />
            Configuration
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* API Keys */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-violet-400" />
                <h2 className="text-white font-semibold">Connexions</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Anthropic Claude API', status: true },
                  { label: 'Apify (scraping)', status: true },
                  { label: 'YouTube (via Apify)', status: true },
                  { label: 'Instagram (via Apify)', status: true },
                  { label: 'TikTok (via Apify)', status: true },
                  { label: 'LinkedIn (via Apify)', status: true },
                ].map((api) => (
                  <div key={api.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/70 text-sm">{api.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      api.status
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/5 text-white/30'
                    }`}>
                      {api.status ? 'Actif' : 'Non configure'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Brain */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-400" />
                <h2 className="text-white font-semibold">Content Brain</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Webhook URL</span>
                  <span className="text-xs text-white/30">Non configure</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">API Key</span>
                  <span className="text-xs text-white/30">Non configure</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Auto-sync</span>
                  <span className="text-xs text-white/30">Desactive</span>
                </div>
              </div>
            </div>

            {/* Database */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-cyan-400" />
                <h2 className="text-white font-semibold">Base de donnees</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Type</span>
                  <span className="text-xs text-white/50">SQLite (local)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Mode</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                    Production
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Donnees</span>
                  <span className="text-xs text-white/50">Live (Apify)</span>
                </div>
              </div>
            </div>

            {/* Sync */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-green-400" />
                <h2 className="text-white font-semibold">Synchronisation</h2>
              </div>

              {/* Fetch social data */}
              <div className="space-y-2">
                <button
                  onClick={handleFetchData}
                  disabled={fetchStatus === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-50 transition-all"
                >
                  {fetchStatus === 'loading'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Download className="w-4 h-4" />
                  }
                  Recuperer les posts (4 plateformes)
                </button>
                {fetchResult && (
                  <div className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                    fetchStatus === 'success' ? 'bg-green-500/10 text-green-400'
                    : fetchStatus === 'error' ? 'bg-red-500/10 text-red-400'
                    : 'bg-white/5 text-white/50'
                  }`}>
                    {fetchStatus === 'success' ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      : fetchStatus === 'error' ? <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      : <Loader2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 animate-spin" />
                    }
                    <span>{fetchResult}</span>
                  </div>
                )}
              </div>

              {/* Fetch transcripts */}
              <div className="space-y-2">
                <button
                  onClick={handleFetchTranscripts}
                  disabled={transcriptStatus === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/15 disabled:opacity-50 transition-all"
                >
                  {transcriptStatus === 'loading'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <FileText className="w-4 h-4" />
                  }
                  Recuperer les transcripts
                </button>
                {transcriptResult && (
                  <div className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                    transcriptStatus === 'success' ? 'bg-green-500/10 text-green-400'
                    : transcriptStatus === 'error' ? 'bg-red-500/10 text-red-400'
                    : 'bg-white/5 text-white/50'
                  }`}>
                    {transcriptStatus === 'success' ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      : transcriptStatus === 'error' ? <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      : <Loader2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 animate-spin" />
                    }
                    <span>{transcriptResult}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <PostDetailModal />
      </main>
    </div>
  );
}
