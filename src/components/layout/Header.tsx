'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import type { Period } from '@/stores/dashboardStore';
import type { Platform } from '@/types/social';
import { PLATFORM_NAMES } from '@/types/social';
import { RefreshCw, Calendar, X } from 'lucide-react';

const platforms: (Platform | 'ALL')[] = ['ALL', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN'];

const presetPeriods: { value: Exclude<Period, 'custom'>; label: string }[] = [
  { value: '7d', label: '7j' },
  { value: '30d', label: '30j' },
  { value: '90d', label: '90j' },
  { value: '1y', label: '1 an' },
  { value: 'all', label: 'Tout' },
];

export function Header() {
  const {
    selectedPlatform, setSelectedPlatform,
    selectedPeriod, setSelectedPeriod,
    customDateRange, setCustomDateRange,
    fetchDashboardData, isLoading,
  } = useDashboardStore();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    if (showDatePicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDatePicker]);

  function openDatePicker() {
    const today = new Date().toISOString().split('T')[0];
    setFromInput(customDateRange?.from || '2023-01-01');
    setToInput(customDateRange?.to || today);
    setShowDatePicker(true);
  }

  function applyCustomRange() {
    if (fromInput && toInput && fromInput <= toInput) {
      setCustomDateRange(fromInput, toInput);
      setShowDatePicker(false);
    }
  }

  const customLabel = customDateRange
    ? `${formatDateShort(customDateRange.from)} — ${formatDateShort(customDateRange.to)}`
    : 'Perso.';

  return (
    <header className="h-16 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-white font-semibold text-lg hidden lg:block">
          Social Command Center
        </h2>
        {/* Platform filter pills */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPlatform === p
                  ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {p === 'ALL' ? 'Tous' : PLATFORM_NAMES[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Period selector */}
        <div className="relative flex items-center gap-1 bg-white/5 rounded-xl p-1" ref={pickerRef}>
          <Calendar className="w-3.5 h-3.5 text-white/30 ml-2" />
          {presetPeriods.map((p) => (
            <button
              key={p.value}
              onClick={() => { setSelectedPeriod(p.value); setShowDatePicker(false); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPeriod === p.value
                  ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
          {/* Custom date button */}
          <button
            onClick={openDatePicker}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              selectedPeriod === 'custom'
                ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {selectedPeriod === 'custom' ? customLabel : 'Perso.'}
          </button>

          {/* Date picker dropdown */}
          {showDatePicker && (
            <div className="absolute top-full right-0 mt-2 bg-[#1A1A2E] border border-white/10 rounded-xl p-4 shadow-2xl z-50 min-w-[300px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-medium">Periode personnalisee</span>
                <button onClick={() => setShowDatePicker(false)} className="text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Du</label>
                  <input
                    type="date"
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Au</label>
                  <input
                    type="date"
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]"
                  />
                </div>
                <button
                  onClick={applyCustomRange}
                  disabled={!fromInput || !toInput || fromInput > toInput}
                  className="w-full py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90"
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>
    </header>
  );
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
