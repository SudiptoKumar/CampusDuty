import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useFlashcardStore } from './useFlashcardStore';
import { getDueCards, getMasteryColor } from './utils';

export default function DeckDetailView() {
  const { decks, selectedDeckId, selectDeck, addCard, removeCard, startStudy } = useFlashcardStore();
  const deck = decks.find(d => d.id === selectedDeckId);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  if (!deck) return null;

  const due = getDueCards(deck.cards).length;
  const masteredPct = deck.cards.length > 0 ? Math.round((deck.cards.filter(c => c.mastery === 'mastered').length / deck.cards.length) * 100) : 0;

  const handleAdd = () => {
    if (!front.trim() || !back.trim()) return;
    addCard(deck.id, front.trim(), back.trim(), []);
    setFront(''); setBack('');
  };

  const sorted = [...deck.cards].sort((a, b) => {
    const order = { new: 0, learning: 1, review: 2, mastered: 3 };
    return order[a.mastery] - order[b.mastery];
  });

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => selectDeck(null)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{deck.name}</h3>
          {deck.category && <span className="text-[10px] text-muted-foreground">{deck.category}</span>}
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">{deck.cards.length} cards</span>
            <span className="text-xs font-medium text-foreground">{masteredPct}% mastered</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div className="h-full bg-primary rounded-full" style={{ width: `${masteredPct}%` }} />
          </div>
          <div className="flex gap-2">
            {due > 0 && <Button onClick={() => startStudy(deck.id)} className="flex-1">Study {due} Due</Button>}
            <Button variant="outline" onClick={() => startStudy(deck.id)} className={due > 0 ? '' : 'flex-1'}>Study All</Button>
          </div>
        </CardContent>
      </Card>

      {/* Add card */}
      <div className="flex gap-2">
        <Input placeholder="Front" value={front} onChange={e => setFront(e.target.value)} className="flex-1 h-9 text-sm" />
        <Input placeholder="Back" value={back} onChange={e => setBack(e.target.value)} className="flex-1 h-9 text-sm" />
        <Button size="icon" onClick={handleAdd} className="h-9 w-9 shrink-0"><Plus className="w-4 h-4" /></Button>
      </div>

      {/* Cards list */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {sorted.map(c => (
          <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getMasteryColor(c.mastery) }} />
            <span className="text-foreground truncate flex-1">{c.front}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: getMasteryColor(c.mastery) + '20', color: getMasteryColor(c.mastery) }}>{c.mastery}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCard(deck.id, c.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
