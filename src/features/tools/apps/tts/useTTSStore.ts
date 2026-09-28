import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TTSDocument, ListeningRecord, VoicePreferences } from './types';

interface TTSState {
  documents: TTSDocument[];
  activeDocId: string | null;
  history: ListeningRecord[];
  preferences: VoicePreferences;

  addDocument: (doc: TTSDocument) => void;
  removeDocument: (id: string) => void;
  setActiveDoc: (id: string | null) => void;

  addListeningRecord: (record: ListeningRecord) => void;

  setPreferences: (prefs: Partial<VoicePreferences>) => void;
}

export const useTTSStore = create<TTSState>()(
  persist(
    (set) => ({
      documents: [],
      activeDocId: null,
      history: [],
      preferences: { lang: 'en-US', voiceName: '', speed: 1 },

      addDocument: (doc) => set((s) => ({
        documents: [doc, ...s.documents].slice(0, 20),
        activeDocId: doc.id,
      })),

      removeDocument: (id) => set((s) => ({
        documents: s.documents.filter(d => d.id !== id),
        activeDocId: s.activeDocId === id ? null : s.activeDocId,
      })),

      setActiveDoc: (id) => set({ activeDocId: id }),

      addListeningRecord: (record) => set((s) => ({
        history: [record, ...s.history].slice(0, 100),
      })),

      setPreferences: (prefs) => set((s) => ({
        preferences: { ...s.preferences, ...prefs },
      })),
    }),
    { name: 'tts-storage' }
  )
);
