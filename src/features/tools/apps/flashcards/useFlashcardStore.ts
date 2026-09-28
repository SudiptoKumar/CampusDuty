import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import type { Deck, FlashCard, StudySession, FlashcardTab, ReviewGrade } from './types';
import { calculateNextReview } from './utils';

const COLORS = ['hsl(var(--primary))', 'hsl(262, 83%, 58%)', 'hsl(142, 71%, 45%)', 'hsl(35, 90%, 55%)', 'hsl(340, 80%, 55%)'];
const OLD_KEY = 'campus-duty-flashcards';

interface FlashcardState {
  decks: Deck[];
  sessions: StudySession[];
  activeTab: FlashcardTab;
  selectedDeckId: string | null;
  studyDeckId: string | null;

  setActiveTab: (tab: FlashcardTab) => void;
  selectDeck: (id: string | null) => void;
  startStudy: (deckId: string) => void;
  stopStudy: () => void;

  addDeck: (name: string, category: string, description: string) => void;
  removeDeck: (id: string) => void;
  addCard: (deckId: string, front: string, back: string, tags: string[]) => void;
  removeCard: (deckId: string, cardId: string) => void;
  reviewCard: (deckId: string, cardId: string, grade: ReviewGrade) => void;
  addSession: (session: Omit<StudySession, 'id'>) => void;
}

function migrateOld(): Deck[] {
  try {
    const raw = localStorage.getItem(OLD_KEY);
    if (!raw) return [];
    const old = JSON.parse(raw);
    if (!Array.isArray(old)) return [];
    return old.map((d: any, i: number) => ({
      id: d.id || crypto.randomUUID(),
      name: d.name || 'Deck',
      category: 'General',
      color: d.color || COLORS[i % COLORS.length],
      description: '',
      lastStudied: null,
      createdAt: new Date().toISOString(),
      cards: (d.cards || []).map((c: any) => ({
        id: c.id || crypto.randomUUID(),
        front: c.front || '',
        back: c.back || '',
        tags: [],
        mastery: c.known ? 'mastered' as const : 'new' as const,
        ease: 2.5,
        interval: c.known ? 21 : 0,
        nextReview: format(new Date(), 'yyyy-MM-dd'),
        lastReviewed: null,
      })),
    }));
  } catch { return []; }
}

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      decks: [],
      sessions: [],
      activeTab: 'dashboard',
      selectedDeckId: null,
      studyDeckId: null,

      setActiveTab: (tab) => set({ activeTab: tab, selectedDeckId: null, studyDeckId: null }),
      selectDeck: (id) => set({ selectedDeckId: id }),
      startStudy: (deckId) => set({ studyDeckId: deckId }),
      stopStudy: () => set({ studyDeckId: null }),

      addDeck: (name, category, description) => set(s => ({
        decks: [...s.decks, {
          id: crypto.randomUUID(), name, category, description,
          color: COLORS[s.decks.length % COLORS.length],
          cards: [], lastStudied: null, createdAt: new Date().toISOString(),
        }],
      })),

      removeDeck: (id) => set(s => ({
        decks: s.decks.filter(d => d.id !== id),
        selectedDeckId: s.selectedDeckId === id ? null : s.selectedDeckId,
        studyDeckId: s.studyDeckId === id ? null : s.studyDeckId,
      })),

      addCard: (deckId, front, back, tags) => set(s => ({
        decks: s.decks.map(d => d.id === deckId ? {
          ...d, cards: [...d.cards, {
            id: crypto.randomUUID(), front, back, tags,
            mastery: 'new', ease: 2.5, interval: 0,
            nextReview: format(new Date(), 'yyyy-MM-dd'), lastReviewed: null,
          }],
        } : d),
      })),

      removeCard: (deckId, cardId) => set(s => ({
        decks: s.decks.map(d => d.id === deckId ? { ...d, cards: d.cards.filter(c => c.id !== cardId) } : d),
      })),

      reviewCard: (deckId, cardId, grade) => set(s => ({
        decks: s.decks.map(d => d.id === deckId ? {
          ...d, lastStudied: new Date().toISOString(),
          cards: d.cards.map(c => c.id === cardId ? {
            ...c, ...calculateNextReview(c, grade), lastReviewed: new Date().toISOString(),
          } : c),
        } : d),
      })),

      addSession: (session) => set(s => ({
        sessions: [...s.sessions, { ...session, id: crypto.randomUUID() }],
      })),
    }),
    {
      name: 'flashcard-store',
      partialize: (s) => ({ decks: s.decks, sessions: s.sessions }),
      onRehydrateStorage: () => (state) => {
        if (state && state.decks.length === 0) {
          const migrated = migrateOld();
          if (migrated.length > 0) {
            state.decks = migrated;
            localStorage.removeItem(OLD_KEY);
          }
        }
      },
    }
  )
);
