import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, Clock, PenTool, CalendarDays, FlaskConical } from 'lucide-react';

const taglines = [
  'Your Academic Companion',
  'Study Smarter, Not Harder',
  'Stay Organized, Stay Ahead',
  'Your Campus, Your Way',
];

export function LoginLeftPanel() {
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Ambient floating orbs - slower, elegant */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-72 h-72 rounded-full bg-primary/8 blur-[120px] float" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[20%] right-[15%] w-56 h-56 rounded-full bg-[hsl(var(--accent-lavender)/0.08)] blur-[100px] float" style={{ animationDelay: '3s', animationDuration: '12s' }} />
        <div className="absolute top-[55%] left-[50%] w-40 h-40 rounded-full bg-[hsl(var(--accent-sky)/0.06)] blur-[80px] float" style={{ animationDelay: '6s', animationDuration: '14s' }} />
      </div>

      {/* Floating campus icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { Icon: BookOpen, x: '12%', y: '20%', delay: 0, size: 20, rotate: -12 },
          { Icon: Clock, x: '78%', y: '15%', delay: 1.5, size: 18, rotate: 8 },
          { Icon: PenTool, x: '85%', y: '55%', delay: 3, size: 16, rotate: -6 },
          { Icon: CalendarDays, x: '8%', y: '70%', delay: 4.5, size: 22, rotate: 10 },
          { Icon: FlaskConical, x: '72%', y: '78%', delay: 2, size: 17, rotate: -15 },
        ].map(({ Icon, x, y, delay, size, rotate }, i) => (
          <motion.div
            key={i}
            className="absolute text-muted-foreground/20"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + delay * 0.2, duration: 0.6 }}
          >
            <div className="float" style={{ animationDelay: `${delay}s`, animationDuration: `${8 + i * 2}s` }}>
              <Icon style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content - centered */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 xl:px-16">
        {/* Logo icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="w-20 h-20 rounded-3xl bg-primary/15 backdrop-blur-xl flex items-center justify-center border border-primary/20">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>
        </motion.div>

        {/* Animated wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl xl:text-6xl font-bold tracking-tight mb-4 login-shimmer-text"
        >
          Campus Duty
        </motion.h1>

        {/* Rotating tagline */}
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={taglineIndex}
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.4 }}
              className="text-lg text-muted-foreground font-medium"
            >
              {taglines[taglineIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 h-px w-48 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        />
      </div>
    </div>
  );
}
