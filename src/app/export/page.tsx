'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Upload, Download, Check, Loader2, FileJson } from 'lucide-react';

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ date: string; version: number } | null>(null);
  const [exportData, setExportData] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/export/content-brain', { method: 'POST' });
      const data = await res.json();
      setExportData(JSON.stringify(data, null, 2));
      setLastExport({
        date: new Date().toLocaleDateString('fr-FR'),
        version: data.promptDNA?.version ?? 0,
      });
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportData) return;
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-brain-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <Header />
        <div className="p-4 lg:p-6 space-y-6">
          <h1 className="text-2xl font-bold text-white">Export Content Brain</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export action */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                <Upload className="w-7 h-7 text-violet-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">Exporter vers Content Brain</h2>
              <p className="text-white/50 text-sm">
                Génère un export complet du Prompt DNA actif avec tous les insights et les instructions
                de mise à jour pour Content Brain.
              </p>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                {isExporting ? 'Export en cours...' : 'Lancer l\'export'}
              </button>
              {lastExport && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  Dernier export: v{lastExport.version} — {lastExport.date}
                </div>
              )}
            </div>

            {/* Download JSON */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <FileJson className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">Télécharger le JSON</h2>
              <p className="text-white/50 text-sm">
                Télécharge le dernier export en fichier JSON pour import manuel dans Content Brain
                ou pour archivage.
              </p>
              <button
                onClick={handleDownload}
                disabled={!exportData}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Télécharger JSON
              </button>
            </div>
          </div>

          {/* Preview */}
          {exportData && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Aperçu de l'export</h2>
              <pre className="bg-black/30 rounded-xl p-4 text-xs text-white/60 overflow-auto max-h-96 font-mono">
                {exportData}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
