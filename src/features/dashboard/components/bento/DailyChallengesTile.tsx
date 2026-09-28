import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, Target } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';

export function DailyChallengesTile() {
  const { data: tasks = [] } = useTasks();
  const { data: attendance = [] } = useAttendance();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const challenges = useMemo(() => {
    const todayCompletedTasks = tasks.filter(t => t.is_completed && t.updated_at?.startsWith(today)).length;
    const todayAttendance = attendance.filter(a => a.date === today).length;
    
    return [
      { label: 'Complete 3 tasks', done: todayCompletedTasks >= 3, progress: `${Math.min(todayCompletedTasks, 3)}/3` },
      { label: 'Mark attendance', done: todayAttendance >= 1, progress: todayAttendance >= 1 ? '✓' : '0/1' },
      { label: 'Add a note or grade', done: false, progress: '0/1' },
    ];
  }, [tasks, attendance, today]);

  const doneCount = challenges.filter(c => c.done).length;
  
  return (
    <Card>
      <CardContent className="py-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold">Daily Challenges</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{doneCount}/{challenges.length}</span>
        </div>
        <div className="space-y-2">
          {challenges.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {c.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
              )}
              <span className={c.done ? 'line-through text-muted-foreground' : ''}>{c.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{c.progress}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
