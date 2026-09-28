import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, differenceInHours } from 'date-fns';
import { Flame, Clock } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useSubjects } from '@/hooks/useSubjects';

export function ExamCountdownTile() {
  const navigate = useNavigate();
  const { data: tasks } = useTasks();
  const { data: subjects } = useSubjects();

  const upcomingExams = useMemo(() => {
    if (!tasks) return [];
    const now = new Date();
    return tasks
      .filter(t => t.type === 'exam' && !t.is_completed && new Date(t.due_date) >= now)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 3);
  }, [tasks]);

  if (upcomingExams.length === 0) return null;

  return (
    <button
      onClick={() => navigate('/exam-mode')}
      className="w-full surface-card rounded-2xl p-4 text-left hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-medium">Exam Countdown</span>
      </div>

      <div className="space-y-3">
        {upcomingExams.map((exam) => {
          const examDate = new Date(exam.due_date);
          const now = new Date();
          const daysLeft = differenceInDays(examDate, now);
          const hoursLeft = differenceInHours(examDate, now) % 24;

          const urgency =
            daysLeft < 3 ? 'urgent' : daysLeft < 7 ? 'warning' : 'safe';

          const subjectName = subjects?.find(s => s.id === exam.subject_id)?.name;
          const subjectColor = subjects?.find(s => s.id === exam.subject_id)?.color;

          return (
            <div key={exam.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {subjectColor && (
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: subjectColor }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{exam.title}</p>
                  {subjectName && (
                    <p className="text-xs text-muted-foreground truncate">{subjectName}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    urgency === 'urgent'
                      ? 'bg-red-500 animate-pulse'
                      : urgency === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    urgency === 'urgent'
                      ? 'text-red-500'
                      : urgency === 'warning'
                        ? 'text-amber-500'
                        : 'text-green-500'
                  }`}
                >
                  {daysLeft > 0
                    ? `${daysLeft}d ${hoursLeft}h`
                    : `${hoursLeft}h`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </button>
  );
}
