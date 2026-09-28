import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, Layers, Flame, Trash2 } from 'lucide-react';
import { useFlashcardStore } from './useFlashcardStore';
import { getDueCards } from './utils';
import { format, subDays } from 'date-fns';
import CreateDeckSheet from './CreateDeckSheet';

export default function DashboardView() {
  const { decks, sessions, selectDeck, startStudy, removeDeck } = useFlashcardStore();
  const [showCreate, setShowCreate] = useState(false);

  const totalCards = decks.reduce((a, d) => a + d.cards.length, 0);
  const totalMastered = decks.reduce((a, d) => a + d.cards.filter(c => c.mastery === 'mastered').length, 0);

  // Streak
  let streak = 0;
  let d = new Date();
  while (true) {
    const dayStr = format(d, 'yyyy-MM-dd');
    if (sessions.some(s => s.date.startsWith(dayStr))) { streak++; d = subDays(d, 1); } else break;
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-lg">Flashcards</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" /> New Deck</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="p-2 text-center"><p className="text-lg font-bold text-foreground">{totalCards}</p><p className="text-[9px] text-muted-foreground">Cards</p></CardContent></Card>
        <Card><CardContent className="p-2 text-center"><p className="text-lg font-bold text-foreground">{totalMastered}</p><p className="text-[9px] text-muted-foreground">Mastered</p></CardContent></Card>
        <Card><CardContent className="p-2 text-center"><p className="text-lg font-bold text-foreground">{streak}<Flame className="w-3 h-3 inline ml-0.5 text-orange-500" /></p><p className="text-[9px] text-muted-foreground">Streak</p></CardContent></Card>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-10">
          <Layers className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No decks yet. Create one above!</p>
        </div>
      ) : decks.map(deck => {
        const due = getDueCards(deck.cards).length;
        const masteredPct = deck.cards.length > 0 ? Math.round((deck.cards.filter(c => c.mastery === 'mastered').length / deck.cards.length) * 100) : 0;
        return (
          <Card key={deck.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => selectDeck(deck.id)}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: deck.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-foreground truncate">{deck.name}</p>
                  {deck.category && <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{deck.category}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground">{deck.cards.length} cards · {masteredPct}% mastered</p>
                {due > 0 && <p className="text-[10px] text-primary font-medium">{due} due today</p>}
              </div>
              {due > 0 && (
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={e => { e.stopPropagation(); startStudy(deck.id); }}>Study</Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); removeDeck(deck.id); }}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        );
      })}

      <CreateDeckSheet open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
