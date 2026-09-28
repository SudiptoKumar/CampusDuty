import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { AnimatedCounter } from '@/components/shared';

export function StreakTile() {
  const { data: profile } = useProfile();
  
  const streak = profile?.visit_streak ?? 0;
  const totalVisits = profile?.total_visits ?? 0;
  
  // Fire intensity based on streak
  const getFireIntensity = () => {
    if (streak >= 30) return { scale: 1.3, colors: ['#FF4500', '#FF6B35', '#FFD700'] };
    if (streak >= 14) return { scale: 1.2, colors: ['#FF6B35', '#FF8C42', '#FFA07A'] };
    if (streak >= 7) return { scale: 1.1, colors: ['#FF8C42', '#FFA07A', '#FFB366'] };
    return { scale: 1, colors: ['#FFA07A', '#FFB366', '#FFCC80'] };
  };
  
  const intensity = getFireIntensity();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 p-4"
    >
      {/* Animated fire glow */}
      <motion.div
        animate={{
          opacity: [0.4, 0.7, 0.4],
          y: [0, -5, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-500/30 rounded-full blur-xl"
      />
      
      <div className="relative text-center">
        {/* Fire icon */}
        <motion.div
          animate={{ scale: [1, intensity.scale, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-flex items-center justify-center w-12 h-12 mb-2"
        >
          <Flame 
            className="w-8 h-8" 
            style={{ color: intensity.colors[0] }}
          />
        </motion.div>
        
        {/* Streak count */}
        <div className="text-3xl font-bold">
          <AnimatedCounter value={streak} />
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          Day Streak
        </div>
        
        {/* Total visits */}
        <div className="mt-2 text-xs text-muted-foreground">
          <AnimatedCounter value={totalVisits} /> total visits
        </div>
      </div>
    </motion.div>
  );
}
