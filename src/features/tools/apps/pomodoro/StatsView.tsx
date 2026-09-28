import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { usePomodoroStore } from './usePomodoroStore';
import { format, subDays, startOfDay } from 'date-fns';

const CATEGORY_COLORS: Record<string, string> = {
  work: 'hsl(var(--primary))',
  personal: 'hsl(262, 83%, 58%)',
  study: 'hsl(142, 71%, 45%)',
};

export default function StatsView() {
  const { sessions, tasks } = usePomodoroStore();

  const totalFocusMin = Math.round(sessions.filter(s => s.type === 'focus').reduce((a, s) => a + s.duration, 0) / 60);
  const totalSessions = sessions.filter(s => s.type === 'focus').length;

  // Weekly data
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(startOfDay(day), 'yyyy-MM-dd');
    const mins = Math.round(sessions.filter(s => s.type === 'focus' && s.date.startsWith(dayStr)).reduce((a, s) => a + s.duration, 0) / 60);
    return { day: format(day, 'EEE'), mins };
  });

  // Category distribution
  const catData = (['work', 'personal', 'study'] as const).map(cat => ({
    name: cat,
    value: tasks.filter(t => t.category === cat).reduce((a, t) => a + t.completedPomodoros, 0),
  })).filter(c => c.value > 0);

  // Current streak
  let streak = 0;
  let d = new Date();
  while (true) {
    const dayStr = format(startOfDay(d), 'yyyy-MM-dd');
    if (sessions.some(s => s.type === 'focus' && s.date.startsWith(dayStr))) {
      streak++;
      d = subDays(d, 1);
    } else break;
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <h3 className="font-semibold text-foreground">Statistics</h3>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Focus Time', value: `${totalFocusMin}m` },
          { label: 'Sessions', value: totalSessions },
          { label: 'Streak', value: `${streak}d` },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-3">Weekly Activity</h4>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Bar dataKey="mins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {catData.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-3">Task Distribution</h4>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={catData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
                    {catData.map(c => <Cell key={c.name} fill={CATEGORY_COLORS[c.name]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1">
                {catData.map(c => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.name] }} />
                    <span className="text-xs text-foreground capitalize">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sessions.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Sessions</h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {sessions.slice(-10).reverse().map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs py-1">
                  <span className="text-foreground capitalize">{s.type === 'focus' ? '🎯 Focus' : s.type === 'shortBreak' ? '☕ Break' : '🌴 Long Break'}</span>
                  <span className="text-muted-foreground">{Math.round(s.duration / 60)}m · {format(new Date(s.date), 'MMM d, HH:mm')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
