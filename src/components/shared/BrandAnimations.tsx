import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export const PALETTE = [
  '#5865F2', '#8B5CF6', '#EC4899', '#F43F5E',
  '#F97316', '#22C55E', '#14B8A6',
];

export function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function extractFirstName(fullName: string): string {
  const prefixes = ['md.', 'md', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms', 'dr.', 'dr', 'prof.', 'prof', 'engr.', 'engr'];
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1 && prefixes.includes(parts[0].toLowerCase())) {
    return parts[1];
  }
  return parts[0];
}

/* ── Mesh Gradient Background ── */
export function MeshGradientBg({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${rgba(color, 0.03)} 0%, transparent 50%, ${rgba(color, 0.05)} 100%)` }} />
      <motion.div
        className="absolute rounded-full will-change-transform"
        style={{ width: 500, height: 500, left: '-10%', top: '-15%', background: `radial-gradient(circle, ${rgba(color, 0.12)}, transparent 65%)`, filter: 'blur(80px)' }}
        animate={{ x: [0, 80, 30, -40, 0], y: [0, 50, -30, 20, 0], scale: [1, 1.2, 0.9, 1.1, 1], borderRadius: ['50%', '40% 60% 50% 50%', '55% 45% 60% 40%', '45% 55% 40% 60%', '50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full will-change-transform"
        style={{ width: 400, height: 400, right: '-5%', top: '30%', background: `radial-gradient(circle, ${rgba(color, 0.10)}, transparent 65%)`, filter: 'blur(70px)' }}
        animate={{ x: [0, -60, 20, -30, 0], y: [0, -40, 60, -20, 0], scale: [1, 0.9, 1.15, 0.95, 1], borderRadius: ['50%', '55% 45% 40% 60%', '40% 60% 55% 45%', '60% 40% 45% 55%', '50%'] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute rounded-full will-change-transform"
        style={{ width: 350, height: 350, left: '30%', bottom: '-10%', background: `radial-gradient(circle, ${rgba(color, 0.08)}, transparent 65%)`, filter: 'blur(60px)' }}
        animate={{ x: [0, 40, -50, 25, 0], y: [0, -50, 20, -30, 0], scale: [1, 1.1, 0.85, 1.05, 1], borderRadius: ['50%', '45% 55% 60% 40%', '60% 40% 45% 55%', '40% 60% 50% 50%', '50%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      />
    </div>
  );
}

/* ── Animation 1: Graduation Toss ── */
function GraduationTossLogo({ color }: { color: string }) {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <motion.div className="absolute bottom-2 w-14 h-3 rounded-full" style={{ background: rgba(color, 0.15), filter: 'blur(4px)' }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3, 1], opacity: [0, 0.6, 0.3] }} transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }} />
      <motion.div className="relative z-10 w-16 h-16 rounded-2xl backdrop-blur-xl flex items-center justify-center" style={{ background: rgba(color, 0.1), border: `1.5px solid ${rgba(color, 0.2)}`, boxShadow: `0 0 30px ${rgba(color, 0.1)}` }} initial={{ scale: 0, y: -60 }} animate={{ scale: [0, 1.25, 0.95, 1.05, 1], y: [-60, 0, 0, 0, 0] }} transition={{ type: 'spring', stiffness: 300, damping: 12, mass: 0.8 }}>
        <GraduationCap className="w-8 h-8" style={{ color }} />
      </motion.div>
    </div>
  );
}

/* ── Animation 2: Tassel Swing ── */
function TasselSwingLogo({ color }: { color: string }) {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <motion.div className="relative z-10 w-16 h-16 rounded-2xl backdrop-blur-xl flex items-center justify-center" style={{ background: rgba(color, 0.1), border: `1.5px solid ${rgba(color, 0.2)}`, boxShadow: `0 0 30px ${rgba(color, 0.1)}` }} initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: [0, -8, 6, -4, 2, 0] }} transition={{ opacity: { duration: 0.4 }, rotate: { duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' } }}>
        <GraduationCap className="w-8 h-8" style={{ color }} />
      </motion.div>
    </div>
  );
}


/* ── Dynamic Logo ── */
const LOGO_ANIMATIONS = [GraduationTossLogo, TasselSwingLogo];

export function DynamicLogo({ color }: { color: string }) {
  const AnimationComponent = useMemo(() => LOGO_ANIMATIONS[Math.floor(Math.random() * LOGO_ANIMATIONS.length)], []);
  return <AnimationComponent color={color} />;
}

/* ── Typewriter Text ── */
export function TypewriterText({ text, color, delay = 0.6 }: { text: string; color: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, 80);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <span className="relative">
      <motion.span
        className="text-2xl font-bold tracking-tight bg-clip-text text-transparent"
        style={{
          backgroundImage: done ? `linear-gradient(90deg, ${color}, ${rgba(color, 0.5)}, ${color})` : `linear-gradient(90deg, ${color}, ${color})`,
          backgroundSize: done ? '200% auto' : '100% auto',
        }}
        animate={done ? { backgroundPosition: ['0% center', '200% center'] } : {}}
        transition={done ? { duration: 4, repeat: Infinity, ease: 'linear' } : {}}
      >
        {displayed}
      </motion.span>
      {!done && (
        <motion.span className="inline-block w-0.5 h-6 ml-0.5 align-middle rounded-full" style={{ background: color }} animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
      )}
    </span>
  );
}

/* ── Gradient Divider ── */
export function GradientDivider({ color }: { color: string }) {
  return (
    <motion.div
      className="h-px w-full my-1"
      style={{ background: `linear-gradient(90deg, transparent, ${rgba(color, 0.2)}, transparent)` }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    />
  );
}

/* ── Stagger variants ── */
export const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};
