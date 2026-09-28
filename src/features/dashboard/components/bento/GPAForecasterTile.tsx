import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGrades } from '@/hooks/useGrades';
import { useSubjects } from '@/hooks/useSubjects';
import { AnimatedCounter } from '@/components/shared';

export function GPAForecasterTile() {
  const { data: grades } = useGrades();
  const { data: subjects } = useSubjects();
  
  // Calculate weighted average across all subjects
  const calculateGPA = () => {
    if (!grades || grades.length === 0) return { gpa: 0, trend: 'stable' as const };
    
    const totalWeightedScore = grades.reduce((acc, g) => {
      const percentage = (g.value / g.max_score) * 100;
      return acc + percentage * g.weight;
    }, 0);
    
    const totalWeight = grades.reduce((acc, g) => acc + g.weight, 0);
    const average = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    
    // Simulate trend based on recent vs older grades
    const midpoint = Math.floor(grades.length / 2);
    const recentGrades = grades.slice(0, midpoint);
    const olderGrades = grades.slice(midpoint);
    
    const recentAvg = recentGrades.reduce((acc, g) => acc + (g.value / g.max_score) * 100, 0) / (recentGrades.length || 1);
    const olderAvg = olderGrades.reduce((acc, g) => acc + (g.value / g.max_score) * 100, 0) / (olderGrades.length || 1);
    
    const trend = recentAvg > olderAvg + 2 ? 'up' : recentAvg < olderAvg - 2 ? 'down' : 'stable';
    
    return { gpa: average, trend };
  };
  
  const { gpa, trend } = calculateGPA();
  
  // Convert to GPA scale (0-4)
  const gpaScale = (gpa / 100) * 4;
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };
  
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4"
    >
      {/* Animated background glow */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-8 -right-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl"
      />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            CGPA Trend
          </span>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={`text-xs font-medium ${getTrendColor()}`}>
              {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
            </span>
          </div>
        </div>
        
        {/* GPA Display */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">
            <AnimatedCounter value={gpaScale} decimals={2} />
          </span>
          <span className="text-sm text-muted-foreground">/4.0</span>
        </div>
        
        {/* Percentage */}
        <p className="text-xs text-muted-foreground mt-1">
          Overall: <AnimatedCounter value={gpa} decimals={1} />%
        </p>
        
        {/* Mini chart visualization */}
        <div className="flex items-end gap-0.5 mt-3 h-8">
          {[65, 72, 68, 78, 82, 75, 80].map((val, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${val}%` }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="flex-1 rounded-t bg-primary/40"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
