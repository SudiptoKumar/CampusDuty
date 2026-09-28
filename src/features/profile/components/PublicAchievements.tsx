import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACHIEVEMENT_DEFINITIONS } from '@/hooks/useAchievements';

interface PublicAchievementsProps {
  username: string;
}

export function PublicAchievements({ username }: PublicAchievementsProps) {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['public-achievements', username],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_profile_achievements', {
        _username: username,
      });
      if (error) throw error;
      return data as { achievement_key: string; unlocked_at: string }[];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="surface-card p-4 rounded-2xl animate-pulse">
        <div className="h-4 bg-muted rounded w-32 mb-3" />
        <div className="h-1.5 bg-muted rounded-full mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-16 h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalPossible = ACHIEVEMENT_DEFINITIONS.length;
  const unlockedCount = achievements?.length || 0;
  const unlockedKeys = new Set(achievements?.map(a => a.achievement_key) || []);

  return (
    <motion.div
      className="surface-card p-4 rounded-2xl space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Achievements
        </h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {unlockedCount}/{totalPossible}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(unlockedCount / totalPossible) * 100}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      </div>

      {/* Badge scroller - show all achievements with unlocked/locked state */}
      {unlockedCount > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {achievements?.map((achievement, index) => {
            const def = ACHIEVEMENT_DEFINITIONS.find(d => d.key === achievement.achievement_key);
            if (!def) return null;

            return (
              <motion.div
                key={achievement.achievement_key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl',
                  'bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/20',
                  'min-w-[60px] group cursor-default'
                )}
                title={`${def.title}: ${def.description}`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {def.icon}
                </span>
                <span className="text-[10px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors">
                  {def.title}
                </span>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty state - show encouraging message */
        <motion.div
          className="flex flex-col items-center justify-center py-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            No badges yet — start using the app to earn achievements!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
