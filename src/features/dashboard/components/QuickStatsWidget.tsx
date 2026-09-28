import { BookOpen, Users, GraduationCap, CheckCircle2 } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useTasks } from '@/hooks/useTasks';
import { useGrades, calculateWeightedAverage } from '@/hooks/useGrades';
import { AnimatedCounter, TiltCard } from '@/components/shared';

export function QuickStatsWidget() {
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers();
  const { data: classes } = useClasses();
  const { data: tasks } = useTasks();
  const { data: grades } = useGrades();
  
  const completedTasks = tasks?.filter((t) => t.is_completed).length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const averageGrade = calculateWeightedAverage(grades ?? []);
  
  const stats = [
    {
      icon: BookOpen,
      label: 'Subjects',
      value: subjects?.length ?? 0,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      icon: Users,
      label: 'Teachers',
      value: teachers?.length ?? 0,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      icon: GraduationCap,
      label: 'Classes',
      value: classes?.length ?? 0,
      color: 'bg-green-500/10 text-green-500',
    },
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: completionRate,
      suffix: '%',
      color: 'bg-orange-500/10 text-orange-500',
    },
  ];

  return (
    <section className="surface-card p-4">
      <h2 className="font-semibold text-sm mb-3">Quick Stats</h2>
      
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat) => (
          <TiltCard key={stat.label} tiltAmount={8} className="rounded-xl">
            <div 
              className="flex flex-col items-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold">
                <AnimatedCounter 
                  value={stat.value} 
                  suffix={stat.suffix} 
                  duration={1200}
                />
              </p>
              <p className="text-[10px] text-muted-foreground text-center">{stat.label}</p>
            </div>
          </TiltCard>
        ))}
      </div>
      
      {/* Average Grade Bar */}
      {averageGrade !== null && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Overall Average</span>
            <span className="font-semibold text-primary">
              <AnimatedCounter value={averageGrade} decimals={1} suffix="%" duration={1500} />
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(averageGrade, 100)}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
