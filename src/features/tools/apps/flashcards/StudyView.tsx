import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFlashcardStore } from './useFlashcardStore';
import { getDueCards, getMasteryColor } from './utils';
import type { ReviewGrade } from './types';

const GRADES: { grade: ReviewGrade; label: string; sub: string; color: string }[] = [
  { grade: 'again', label: 'Again', sub: '<1m', color: 'hsl(0, 70%, 50%)' },
  { grade: 'hard', label: 'Hard', sub: '~2d', color: 'hsl(35, 90%, 55%)' },
  { grade: 'good', label: 'Good', sub: '~4d', color: 'hsl(142, 71%, 45%)' },
  { grade: 'easy', label: 'Easy', sub: '~7d', color: 'hsl(var(--primary))' },
];

export default function StudyView() {
  const { decks, studyDeckId, stopStudy, reviewCard, addSession } = useFlashcardStore();
  const deck = decks.find(d => d.id === studyDeckId);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const startTime = useRef(Date.now());

  if (!deck) return null;

  const dueCards = getDueCards(deck.cards);
  const studyCards = dueCards.length > 0 ? dueCards : deck.cards;

  if (studyCards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-sm text-muted-foreground">No cards in this deck yet.</p>
        <Button variant="outline" onClick={stopStudy}>Back to Deck</Button>
      </div>
    );
  }

  const card = studyCards[cardIndex % studyCards.length];
  const isComplete = cardIndex >= studyCards.length;

  if (isComplete) {
    addSession({
      date: new Date().toISOString(),
      deckId: deck.id,
      cardsStudied: studyCards.length,
      correctCount: correct,
      duration: Math.round((Date.now() - startTime.current) / 1000),
    });

    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="text-4xl">🎉</div>
        <h3 className="font-semibold text-foreground text-lg">Session Complete!</h3>
        <p className="text-sm text-muted-foreground">{correct}/{studyCards.length} correct</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={stopStudy}>Done</Button>
          <Button onClick={() => { setCardIndex(0); setCorrect(0); setFlipped(false); startTime.current = Date.now(); }}>
            <RotateCcw className="w-4 h-4 mr-1" /> Again
          </Button>
        </div>
      </div>
    );
  }

  const handleGrade = (grade: ReviewGrade) => {
    reviewCard(deck.id, card.id, grade);
    if (grade !== 'again') setCorrect(c => c + 1);
    setFlipped(false);
    setTimeout(() => setCardIndex(i => i + 1), 150);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-full flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={stopStudy}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
        <span className="text-xs text-muted-foreground">{cardIndex + 1}/{studyCards.length}</span>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((cardIndex) / studyCards.length) * 100}%` }} />
      </div>

      {/* Mastery badge */}
      <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium" style={{ backgroundColor: getMasteryColor(card.mastery) + '20', color: getMasteryColor(card.mastery) }}>
        {card.mastery}
      </span>

      {/* Card */}
      <div className="w-full max-w-sm cursor-pointer" onClick={() => setFlipped(!flipped)} style={{ perspective: '1000px' }}>
        <motion.div
          className="relative w-full h-56"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Card className="absolute inset-0 flex items-center justify-center p-6 border-2" style={{ backfaceVisibility: 'hidden', borderColor: deck.color + '40' }}>
            <CardContent className="p-0 text-center">
              <p className="text-lg font-semibold text-foreground">{card.front}</p>
              <p className="text-[10px] text-muted-foreground mt-2">Tap to reveal</p>
            </CardContent>
          </Card>
          <Card className="absolute inset-0 flex items-center justify-center p-6 bg-accent" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <CardContent className="p-0 text-center">
              <p className="text-lg text-foreground">{card.back}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grade buttons */}
      {flipped && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 w-full max-w-sm">
          {GRADES.map(g => (
            <button
              key={g.grade}
              onClick={() => handleGrade(g.grade)}
              className="flex-1 py-2 rounded-lg border text-center transition-colors hover:opacity-80"
              style={{ borderColor: g.color + '40' }}
            >
              <p className="text-xs font-bold" style={{ color: g.color }}>{g.label}</p>
              <p className="text-[9px] text-muted-foreground">{g.sub}</p>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
