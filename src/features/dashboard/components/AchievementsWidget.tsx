import { Trophy, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAchievements, ACHIEVEMENT_DEFINITIONS } from '@/hooks/useAchievements';
import { format } from 'date-fns';

export function AchievementsWidget() {
  const { data: achievements, isLoading } = useAchievements();
  
  const unlockedKeys = new Set(achievements?.map((a) => a.achievement_key) || []);
  const unlockedCount = unlockedKeys.size;
  const totalCount = ACHIEVEMENT_DEFINITIONS.length;
  
  // Sort: unlocked first, then locked
  const sortedAchievements = [...ACHIEVEMENT_DEFINITIONS].sort((a, b) => {
    const aUnlocked = unlockedKeys.has(a.key);
    const bUnlocked = unlockedKeys.has(b.key);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });
  
  const getUnlockDate = (key: string) => {
    const achievement = achievements?.find((a) => a.achievement_key === key);
    return achievement ? format(new Date(achievement.unlocked_at), 'MMM d, yyyy') : null;
  };

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Achievements</h2>
            <p className="text-xs text-muted-foreground">{unlockedCount}/{totalCount} unlocked</p>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* Achievements grid */}
      <div className="grid grid-cols-4 gap-2">
        {sortedAchievements.slice(0, 8).map((def) => {
          const isUnlocked = unlockedKeys.has(def.key);
          const unlockDate = getUnlockDate(def.key);
          
          return (
            <motion.div
              key={def.key}
              className={`
                relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all
                ${isUnlocked 
                  ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10' 
                  : 'bg-muted/30 opacity-50'
                }
              `}
              whileHover={{ scale: 1.05 }}
              title={`${def.title}: ${def.description}${unlockDate ? ` (Unlocked: ${unlockDate})` : ''}`}
            >
              <span className="text-xl mb-0.5">{isUnlocked ? def.icon : '🔒'}</span>
              <span className="text-[9px] font-medium leading-tight line-clamp-2">{def.title}</span>
            </motion.div>
          );
        })}
      </div>
      
      {/* Show more if there are more than 8 */}
      {totalCount > 8 && (
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          +{totalCount - 8} more achievements
        </p>
      )}
    </section>
  );
}
