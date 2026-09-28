import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Check, Flame } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useHabitStore } from './useHabitStore';
import AddHabitSheet from './AddHabitSheet';
import { motion } from 'framer-motion';

export default function DashboardView() {
  const { habits, toggleCheckin, selectHabit, selectedDate, setSelectedDate } = useHabitStore();
  const [showAdd, setShowAdd] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const completedToday = habits.filter(h => h.checkins[selectedDate]).length;
  const pct = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

  // Week strip
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE'), day: format(d, 'd') };
  });

  // Streak
  const getStreak = (): number => {
    let streak = 0;
    let d = new Date();
    while (true) {
      const key = format(d, 'yyyy-MM-dd');
      const allDone = habits.length > 0 && habits.every(h => h.checkins[key]);
      if (allDone) { streak++; d = subDays(d, 1); } else break;
    }
    return streak;
  };

  const totalCompleted = habits.reduce((a, h) => a + Object.values(h.checkins).filter(Boolean).length, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col gap-4 py-4">
      <h3 className="font-semibold text-foreground text-lg">{greeting} 👋</h3>

      {/* Week strip */}
      <div className="flex gap-1 justify-between">
        {weekDays.map(d => (
          <button
            key={d.date}
            onClick={() => setSelectedDate(d.date)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${selectedDate === d.date ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            <span className="text-[10px]">{d.label}</span>
            <span className="text-sm font-bold">{d.day}</span>
          </button>
        ))}
      </div>

      {/* Progress ring */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <motion.circle cx="25" cy="25" r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray={125.6} animate={{ strokeDashoffset: 125.6 * (1 - pct / 100) }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{pct}%</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{completedToday} of {habits.length} completed</p>
            <p className="text-xs text-muted-foreground">{pct >= 100 ? '🎉 All done!' : pct >= 70 ? 'Almost there!' : 'Keep going!'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats pills */}
      <div className="flex gap-2">
        <Card className="flex-1"><CardContent className="p-2 text-center"><p className="text-lg font-bold text-foreground">{getStreak()}<Flame className="w-3.5 h-3.5 inline ml-0.5 text-orange-500" /></p><p className="text-[9px] text-muted-foreground">Streak</p></CardContent></Card>
        <Card className="flex-1"><CardContent className="p-2 text-center"><p className="text-lg font-bold text-foreground">{totalCompleted}</p><p className="text-[9px] text-muted-foreground">Total</p></CardContent></Card>
      </div>

      {/* Habits list */}
      {habits.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No habits yet. Add your first one!</p>
        </div>
      ) : habits.map(habit => {
        const checked = habit.checkins[selectedDate];
        // individual streak
        let s = 0;
        let dt = new Date();
        while (habit.checkins[format(dt, 'yyyy-MM-dd')]) { s++; dt = subDays(dt, 1); }
        return (
          <Card key={habit.id} className="cursor-pointer" onClick={() => selectHabit(habit.id)}>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-lg">{habit.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{habit.name}</p>
                {s > 0 && <p className="text-[10px] text-orange-500 flex items-center gap-0.5"><Flame className="w-3 h-3" />{s} day streak</p>}
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggleCheckin(habit.id, selectedDate); }}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'border-transparent' : 'border-muted-foreground/30'}`}
                style={{ backgroundColor: checked ? habit.color : 'transparent' }}
              >
                {checked && <Check className="w-4 h-4 text-white" />}
              </button>
            </CardContent>
          </Card>
        );
      })}

      <Button className="w-full" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> New Habit</Button>
      <AddHabitSheet open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}
