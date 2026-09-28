import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Flame, Trash2, Check } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useHabitStore } from './useHabitStore';
import { motion } from 'framer-motion';

export default function HabitDetailView() {
  const { habits, selectedHabitId, selectHabit, toggleCheckin, removeHabit } = useHabitStore();
  const habit = habits.find(h => h.id === selectedHabitId);
  if (!habit) return null;

  const today = format(new Date(), 'yyyy-MM-dd');

  // Streak
  let streak = 0;
  let d = new Date();
  while (habit.checkins[format(d, 'yyyy-MM-dd')]) { streak++; d = subDays(d, 1); }

  // Best streak
  let bestStreak = 0, curr = 0;
  const allDates = Object.keys(habit.checkins).filter(k => habit.checkins[k]).sort();
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0 || new Date(allDates[i]).getTime() - new Date(allDates[i - 1]).getTime() <= 86400000 * 1.5) {
      curr++;
    } else { curr = 1; }
    bestStreak = Math.max(bestStreak, curr);
  }

  // Completion %
  const totalDays = Math.max(1, Math.ceil((Date.now() - new Date(habit.createdAt).getTime()) / 86400000));
  const checkedDays = Object.values(habit.checkins).filter(Boolean).length;
  const completionPct = Math.round((checkedDays / totalDays) * 100);

  // Week
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const dt = subDays(new Date(), 6 - i);
    return { date: format(dt, 'yyyy-MM-dd'), label: format(dt, 'EEE') };
  });

  // Month heatmap
  const now = new Date();
  const monthDays = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => selectHabit(null)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
        <span className="text-lg">{habit.icon}</span>
        <h3 className="font-semibold text-foreground flex-1">{habit.name}</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { removeHabit(habit.id); selectHabit(null); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
      </div>

      {/* Streak hero */}
      <Card>
        <CardContent className="p-4 text-center">
          <Flame className="w-8 h-8 mx-auto text-orange-500 mb-1" />
          <p className="text-3xl font-bold text-foreground">{streak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </CardContent>
      </Card>

      {/* Week */}
      <Card>
        <CardContent className="p-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">This Week</h4>
          <div className="flex gap-2 justify-between">
            {last7.map(day => {
              const checked = habit.checkins[day.date];
              return (
                <button key={day.date} onClick={() => toggleCheckin(habit.id, day.date)} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{day.label}</span>
                  <div
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{ borderColor: habit.color, backgroundColor: checked ? habit.color : 'transparent' }}
                  >
                    {checked && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{completionPct}%</p><p className="text-[9px] text-muted-foreground">Completion</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{bestStreak}</p><p className="text-[9px] text-muted-foreground">Best Streak</p></CardContent></Card>
      </div>

      {/* Monthly heatmap */}
      <Card>
        <CardContent className="p-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">{format(now, 'MMMM yyyy')}</h4>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const checked = habit.checkins[key];
              return (
                <div
                  key={key}
                  className="aspect-square rounded-sm text-[9px] flex items-center justify-center"
                  style={{
                    backgroundColor: checked ? habit.color : 'hsl(var(--muted))',
                    color: checked ? 'white' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Log today */}
      {!habit.checkins[today] && (
        <Button className="w-full" onClick={() => toggleCheckin(habit.id, today)} style={{ backgroundColor: habit.color }}>
          <Check className="w-4 h-4 mr-1" /> Log Today
        </Button>
      )}
    </div>
  );
}
