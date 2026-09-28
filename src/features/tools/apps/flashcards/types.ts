export type MasteryLevel = 'new' | 'learning' | 'review' | 'mastered';
export type FlashcardTab = 'dashboard' | 'study' | 'profile';

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  mastery: MasteryLevel;
  ease: number; // SM-2 ease factor, default 2.5
  interval: number; // days until next review
  nextReview: string; // ISO date
  lastReviewed: string | null;
}

export interface Deck {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  cards: FlashCard[];
  lastStudied: string | null;
  createdAt: string;
}

export interface StudySession {
  id: string;
  date: string;
  deckId: string;
  cardsStudied: number;
  correctCount: number;
  duration: number; // seconds
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';
