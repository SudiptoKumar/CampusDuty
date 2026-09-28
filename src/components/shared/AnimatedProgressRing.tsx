import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

interface AnimatedProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  bgColor?: string;
  showValue?: boolean;
  suffix?: string;
  label?: string;
  duration?: number;
  children?: React.ReactNode;
}

export function AnimatedProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  className,
  color,
  bgColor,
  showValue = true,
  suffix = '%',
  label,
  duration = 1.5,
  children,
}: AnimatedProgressRingProps) {
  const [containerRef, isInView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Spring animation for smooth value changes
  const springValue = useSpring(0, {
    stiffness: 60,
    damping: 15,
  });
  
  // Calculate SVG dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Transform spring value to stroke dashoffset
  const strokeDashoffset = useTransform(
    springValue,
    [0, 100],
    [circumference, 0]
  );
  
  // Animated display value
  const displayValue = useTransform(springValue, (v) => Math.round(v));
  const [currentDisplayValue, setCurrentDisplayValue] = useState(0);
  
  useEffect(() => {
    const unsubscribe = displayValue.on('change', (v) => {
      setCurrentDisplayValue(v);
    });
    return () => unsubscribe();
  }, [displayValue]);
  
  // Trigger animation when in view
  useEffect(() => {
    if (isInView && !hasAnimated) {
      springValue.set(Math.min(value, 100));
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated, value, springValue]);
  
  // Update value if it changes after initial animation
  useEffect(() => {
    if (hasAnimated) {
      springValue.set(Math.min(value, 100));
    }
  }, [value, hasAnimated, springValue]);
  
  // Get color based on value
  const getColor = () => {
    if (color) return color;
    if (value >= 90) return 'hsl(var(--chart-2))'; // green
    if (value >= 75) return 'hsl(var(--primary))';
    if (value >= 60) return 'hsl(var(--chart-4))'; // yellow
    return 'hsl(var(--destructive))';
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor || 'hsl(var(--muted))'}
          strokeWidth={strokeWidth}
          className="opacity-30"
        />
        
        {/* Animated progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          initial={{ strokeDashoffset: circumference }}
        />
        
        {/* Glow effect */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          initial={{ strokeDashoffset: circumference }}
          className="opacity-20 blur-sm"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ? (
          children
        ) : showValue ? (
          <>
            <motion.span 
              className="text-lg font-bold leading-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              {currentDisplayValue}{suffix}
            </motion.span>
            {label && (
              <motion.span 
                className="text-[10px] text-muted-foreground mt-0.5"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.4 }}
              >
                {label}
              </motion.span>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
