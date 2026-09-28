import { useAchievements, ACHIEVEMENT_DEFINITIONS } from '@/hooks/useAchievements';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

const XP_MAP: Record<string, number> = {
  welcome: 10, first_subject: 15, subjects_5: 50, first_class: 15, classes_10: 50,
  first_task: 15, tasks_5: 40, tasks_25: 100, first_teacher: 15, first_grade: 15,
  first_attendance: 15, first_note: 15, first_goal: 15, goal_complete: 50,
  streak_3: 30, streak_7: 60, streak_14: 100, streak_30: 200,
  profile_complete: 30, social_added: 20,
};

export function XPProgressTile() {
  const { data: achievements = [] } = useAchievements();
  
  const totalXP = achievements.reduce((sum, a) => sum + (XP_MAP[a.achievement_key] || 0), 0);
  const level = Math.floor(totalXP / 100) + 1;
  const xpInLevel = totalXP % 100;
  
  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
      <CardContent className="py-4 px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Level {level}</span>
          </div>
          <span className="text-xs font-bold text-amber-600">{totalXP} XP</span>
        </div>
        <Progress value={xpInLevel} className="h-2" />
        <p className="text-[10px] text-muted-foreground mt-1">{100 - xpInLevel} XP to next level</p>
      </CardContent>
    </Card>
  );
}
