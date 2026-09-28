import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useGrades } from '@/hooks/useGrades';
import { format } from 'date-fns';

interface SubjectAnalyticsCardProps {
  subjectId: string;
  subjectColor: string;
}

export function SubjectAnalyticsCard({ subjectId, subjectColor }: SubjectAnalyticsCardProps) {
  const { data: tasks } = useTasks();
  const { data: grades } = useGrades();

  const subjectTasks = useMemo(() => 
    tasks?.filter(t => t.subject_id === subjectId) ?? [],
    [tasks, subjectId]
  );

  const completedCount = subjectTasks.filter(t => t.is_completed).length;
  const totalCount = subjectTasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const gradeTrend = useMemo(() => {
    const subjectGrades = grades?.filter(g => g.subject_id === subjectId) ?? [];
    return subjectGrades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10)
      .map(g => ({
        date: format(new Date(g.date), 'MMM d'),
        score: Math.round((g.value / g.max_score) * 100),
      }));
  }, [grades, subjectId]);

  if (totalCount === 0 && gradeTrend.length === 0) return null;

  return (
    <div className="surface-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${subjectColor}20` }}
        >
          <BarChart3 className="w-4 h-4" style={{ color: subjectColor }} />
        </div>
        <span className="font-medium">Analytics</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Task Completion */}
        {totalCount > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Task Completion</p>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-2xl font-bold">{completionRate}%</span>
              <span className="text-xs text-muted-foreground mb-1">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${completionRate}%`,
                  backgroundColor: subjectColor,
                }}
              />
            </div>
          </div>
        )}

        {/* Grade Trend */}
        {gradeTrend.length >= 2 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Grade Trend</p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={gradeTrend}>
                <defs>
                  <linearGradient id={`grad-${subjectId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={subjectColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={subjectColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={subjectColor}
                  fill={`url(#grad-${subjectId})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
