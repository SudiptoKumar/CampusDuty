import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFlashcardStore } from './useFlashcardStore';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

const CATEGORIES = ['General', 'Science', 'Math', 'Languages', 'History', 'Programming', 'Other'];

export default function CreateDeckSheet({ open, onOpenChange }: Props) {
  const { addDeck } = useFlashcardStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addDeck(name.trim(), category, description.trim());
    setName(''); setDescription('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader><SheetTitle>New Deck</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="Deck name" value={name} onChange={e => setName(e.target.value)} className="h-10" />
          <Input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="h-10" />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Category</p>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 text-xs rounded-full ${category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{c}</button>
              ))}
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full">Create Deck</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
