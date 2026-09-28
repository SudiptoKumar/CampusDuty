import { useMemo, forwardRef } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type TimetableClass = Database['public']['Tables']['classes']['Row'];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyOverviewChartProps {
  classes: TimetableClass[];
  showWeekends?: boolean;
}

export const WeeklyOverviewChart = forwardRef<HTMLDivElement, WeeklyOverviewChartProps>(
  function WeeklyOverviewChart({ classes, showWeekends = false }, ref) {
  const chartData = useMemo(() => {
    const counts = new Array(7).fill(0);
    
    classes.forEach((c) => {
      if (c.day >= 0 && c.day <= 6) {
        counts[c.day]++;
      }
    });
    
    const today = new Date().getDay();
    
    const days = showWeekends 
      ? [0, 1, 2, 3, 4, 5, 6] 
      : [0, 1, 2, 3, 4]; // Sun-Thu for user's schedule
    
    return days.map((day) => ({
      day,
      name: DAY_LABELS[day],
      classes: counts[day],
      isToday: day === today,
    }));
  }, [classes, showWeekends]);

  const maxClasses = Math.max(...chartData.map(d => d.classes), 1);
  const totalClasses = classes.length;

  return (
    <div className="bg-card/50 rounded-2xl p-4 border border-border/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Weekly Overview</h3>
          <p className="text-xs text-muted-foreground">{totalClasses} classes this week</p>
        </div>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: 'hsl(var(--muted-foreground))',
                fontWeight: 500
              }}
              dy={8}
            />
            <Bar 
              dataKey="classes" 
              radius={[6, 6, 6, 6]}
              maxBarSize={32}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.isToday 
                    ? 'hsl(var(--primary))' 
                    : entry.classes > 0 
                      ? 'hsl(var(--primary) / 0.4)' 
                      : 'hsl(var(--muted))'
                  }
                  className="transition-all duration-300"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend dots */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
          <span>Other days</span>
        </div>
      </div>
    </div>
  );
});
