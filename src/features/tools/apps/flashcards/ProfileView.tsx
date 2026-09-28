import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { useFlashcardStore } from './useFlashcardStore';
import { format, subDays } from 'date-fns';
import { Flame, Award, Target, Brain } from 'lucide-react';

export default function ProfileView() {
  const { decks, sessions } = useFlashcardStore();

  const totalCards = decks.reduce((a, d) => a + d.cards.length, 0);
  const mastered = decks.reduce((a, d) => a + d.cards.filter(c => c.mastery === 'mastered').length, 0);
  const totalStudied = sessions.reduce((a, s) => a + s.cardsStudied, 0);
  const totalCorrect = sessions.reduce((a, s) => a + s.correctCount, 0);
  const accuracy = totalStudied > 0 ? Math.round((totalCorrect / totalStudied) * 100) : 0;

  // Streak
  let streak = 0;
  let d = new Date();
  while (sessions.some(s => s.date.startsWith(format(d, 'yyyy-MM-dd')))) { streak++; d = subDays(d, 1); }

  // Weekly
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const cards = sessions.filter(s => s.date.startsWith(dayStr)).reduce((a, s) => a + s.cardsStudied, 0);
    return { day: format(day, 'EEE'), cards };
  });

  // Achievements
  const achievements = [
    { name: '7 Day Streak', icon: Flame, unlocked: streak >= 7 },
    { name: '100 Cards', icon: Target, unlocked: totalCards >= 100 },
    { name: 'Scholar', icon: Brain, unlocked: mastered >= 50 },
    { name: 'Perfectionist', icon: Award, unlocked: accuracy >= 90 && totalStudied >= 20 },
  ];

  return (
    <div className="flex flex-col gap-4 py-4">
      <h3 className="font-semibold text-foreground text-lg">Profile</h3>

      <div className="grid grid-cols-2 gap-2">
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{mastered}</p><p className="text-[9px] text-muted-foreground">Mastered</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{streak}<Flame className="w-3 h-3 inline ml-0.5 text-orange-500" /></p><p className="text-[9px] text-muted-foreground">Streak</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{accuracy}%</p><p className="text-[9px] text-muted-foreground">Accuracy</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-foreground">{totalStudied}</p><p className="text-[9px] text-muted-foreground">Reviewed</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-3">Weekly Activity</h4>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Bar dataKey="cards" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Achievements</h4>
          <div className="grid grid-cols-2 gap-2">
            {achievements.map(a => (
              <div key={a.name} className={`flex items-center gap-2 p-2 rounded-lg ${a.unlocked ? 'bg-primary/10' : 'bg-muted opacity-50'}`}>
                <a.icon className={`w-5 h-5 ${a.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs text-foreground">{a.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
