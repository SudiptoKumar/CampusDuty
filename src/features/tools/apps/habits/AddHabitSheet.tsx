import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHabitStore } from './useHabitStore';
import type { HabitFrequency } from './types';

const ICONS = ['🎯', '💪', '📚', '🧘', '🏃', '💧', '🍎', '😴', '✍️', '🎵', '🧹', '💊'];
const COLORS = ['#5F6AF7', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export default function AddHabitSheet({ open, onOpenChange }: Props) {
  const { addHabit } = useHabitStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState(COLORS[0]);
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [goal, setGoal] = useState(1);

  const handleAdd = () => {
    if (!name.trim()) return;
    addHabit(name.trim(), icon, color, frequency, [], goal);
    setName('');
    setIcon('🎯');
    setGoal(1);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader><SheetTitle>New Habit</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="Habit name" value={name} onChange={e => setName(e.target.value)} className="h-10" />

          <div>
            <p className="text-xs text-muted-foreground mb-2">Icon</p>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(i => (
                <button key={i} onClick={() => setIcon(i)} className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center ${icon === i ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted'}`}>{i}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Color</p>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'scale-125 border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Frequency</p>
            <div className="flex gap-1">
              {(['daily', 'weekly'] as HabitFrequency[]).map(f => (
                <button key={f} onClick={() => setFrequency(f)} className={`px-4 py-1.5 text-xs rounded-full capitalize ${frequency === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{f}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">Daily Goal:</p>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setGoal(Math.max(1, goal - 1))}>-</Button>
            <span className="text-sm font-bold text-foreground w-6 text-center">{goal}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setGoal(goal + 1)}>+</Button>
          </div>

          <Button onClick={handleAdd} className="w-full">Add Habit</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
