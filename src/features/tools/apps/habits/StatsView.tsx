import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { useHabitStore } from './useHabitStore';
import { format, subDays } from 'date-fns';

export default function StatsView() {
  const { habits } = useHabitStore();

  const totalCheckins = habits.reduce((a, h) => a + Object.values(h.checkins).filter(Boolean).length, 0);

  // Best streak across all habits
  let bestStreak = 0;
  habits.forEach(h => {
    let curr = 0;
    const dates = Object.keys(h.checkins).filter(k => h.checkins[k]).sort();
    dates.forEach((d, i) => {
      if (i === 0 || new Date(d).getTime() - new Date(dates[i - 1]).getTime() <= 86400000 * 1.5) curr++;
      else curr = 1;
      bestStreak = Math.max(bestStreak, curr);
    });
  });

  // Overall completion
  const totalPossible = habits.reduce((a, h) => {
    const days = Math.max(1, Math.ceil((Date.now() - new Date(h.createdAt).getTime()) / 86400000));
    return a + days;
  }, 0);
  const overallPct = totalPossible > 0 ? Math.round((totalCheckins / totalPossible) * 100) : 0;

  // Weekly data
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, 'yyyy-MM-dd');
    const completed = habits.filter(h => h.checkins[key]).length;
    return { day: format(d, 'EEE'), completed };
  });

  return (
    <div className="flex flex-col gap-4 py-4">
      <h3 className="font-semibold text-foreground">Statistics</h3>

      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{overallPct}%</p><p className="text-[9px] text-muted-foreground">Completion</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{bestStreak}</p><p className="text-[9px] text-muted-foreground">Best Streak</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{totalCheckins}</p><p className="text-[9px] text-muted-foreground">Total</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-3">Weekly Activity</h4>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per-habit stats */}
      {habits.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Habits Breakdown</h4>
            <div className="space-y-2">
              {habits.map(h => {
                const total = Object.values(h.checkins).filter(Boolean).length;
                const days = Math.max(1, Math.ceil((Date.now() - new Date(h.createdAt).getTime()) / 86400000));
                const pct = Math.round((total / days) * 100);
                return (
                  <div key={h.id} className="flex items-center gap-2">
                    <span className="text-sm">{h.icon}</span>
                    <span className="text-xs text-foreground flex-1 truncate">{h.name}</span>
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: h.color }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
