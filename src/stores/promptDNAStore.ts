import { create } from 'zustand';
import type { PromptDNAData } from '@/types/social';

interface PromptDNAState {
  versions: PromptDNAData[];
  activeVersion: PromptDNAData | null;
  selectedVersion: PromptDNAData | null;
  compareVersion: PromptDNAData | null;
  isLoading: boolean;
  fetchVersions: () => Promise<void>;
  setSelectedVersion: (version: PromptDNAData) => void;
  setCompareVersion: (version: PromptDNAData | null) => void;
  triggerMutation: () => Promise<void>;
  rollback: (targetVersionId: string) => Promise<void>;
}

export const usePromptDNAStore = create<PromptDNAState>((set, get) => ({
  versions: [],
  activeVersion: null,
  selectedVersion: null,
  compareVersion: null,
  isLoading: false,

  fetchVersions: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/prompt-dna/history');
      const data: PromptDNAData[] = await res.json();
      const active = data.find((v) => v.status === 'ACTIVE') ?? null;
      set({
        versions: data,
        activeVersion: active,
        selectedVersion: active,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setSelectedVersion: (version) => set({ selectedVersion: version }),
  setCompareVersion: (version) => set({ compareVersion: version }),

  triggerMutation: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/prompt-dna/generate', { method: 'POST' });
      await get().fetchVersions();
    } catch {
      set({ isLoading: false });
    }
  },

  rollback: async (targetVersionId) => {
    set({ isLoading: true });
    try {
      await fetch('/api/prompt-dna/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersionId }),
      });
      await get().fetchVersions();
    } catch {
      set({ isLoading: false });
    }
  },
}));
