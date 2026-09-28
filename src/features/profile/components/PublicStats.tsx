import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar, Sparkles } from 'lucide-react';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';

interface PublicStatsProps {
  visitStreak: number;
  totalVisits: number;
  achievementsCount: number;
  memberSince: string;
}

export function PublicStats({
  visitStreak,
  totalVisits,
  achievementsCount,
  memberSince,
}: PublicStatsProps) {
  const stats = [
    {
      icon: Flame,
      label: 'Day Streak',
      value: visitStreak,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: Sparkles,
      label: 'Total Visits',
      value: totalVisits,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Trophy,
      label: 'Achievements',
      value: achievementsCount,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const memberDate = new Date(memberSince);
  const daysSinceJoined = Math.floor((Date.now() - memberDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      className="grid grid-cols-3 gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            className="surface-card p-3 rounded-xl text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className={`w-8 h-8 mx-auto mb-2 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-xl font-bold">
              <AnimatedCounter value={stat.value} />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
              {stat.label}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
