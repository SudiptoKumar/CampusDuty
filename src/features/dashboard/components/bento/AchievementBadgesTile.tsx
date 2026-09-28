import { useAchievements, ACHIEVEMENT_DEFINITIONS } from '@/hooks/useAchievements';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AchievementBadgesTile() {
  const { data: achievements = [] } = useAchievements();
  
  if (achievements.length === 0) return null;

  const recent = achievements.slice(0, 8);
  
  return (
    <Card>
      <CardContent className="py-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold">Achievements</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{achievements.length}/{ACHIEVEMENT_DEFINITIONS.length}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <TooltipProvider>
            {recent.map(a => {
              const def = ACHIEVEMENT_DEFINITIONS.find(d => d.key === a.achievement_key);
              if (!def) return null;
              return (
                <Tooltip key={a.id}>
                  <TooltipTrigger asChild>
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg cursor-default" style={{ backgroundColor: def.color + '20' }}>
                      {def.icon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-medium text-xs">{def.title}</p>
                    <p className="text-[10px] text-muted-foreground">{def.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
