import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, BookOpen, Calendar, Users } from 'lucide-react';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PALETTE, rgba, MeshGradientBg, DynamicLogo, TypewriterText, GradientDivider,
  containerVariants, itemVariants,
} from '@/components/shared/BrandAnimations';

const taglines = [
  'Your Academic Companion',
  'Study Smarter, Not Harder',
  'Stay Organized, Stay Ahead',
];

const benefits = [
  { icon: BookOpen, label: 'Smart Timetable Management' },
  { icon: Calendar, label: 'Never Miss a Deadline' },
  { icon: Users, label: 'Share with Classmates' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tagIndex, setTagIndex] = useState(0);

  const accentColor = useMemo(() => PALETTE[Math.floor(Math.random() * PALETTE.length)], []);

  // Tagline rotation
  useState(() => {
    const interval = setInterval(() => {
      setTagIndex((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message || 'Failed to sign in');
      setIsLoading(false);
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left Panel - Desktop only */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <LiquidEffectAnimation />
        <div className="absolute inset-0 bg-black/30" style={{ zIndex: 1 }} />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <DynamicLogo color="#ffffff" />
          </motion.div>

          <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-3">
              Welcome to<br />
              <span className="text-white/80">Campus Duty</span>
            </h2>
            <div className="h-7 mt-2">
              <AnimatePresence mode="wait">
                <motion.p key={tagIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="text-lg text-white/70">
                  {taglines[tagIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div className="mt-10 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            {benefits.map(({ icon: Icon, label }, i) => (
              <motion.div key={label} className="flex items-center gap-4 text-white/90" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.15 }}>
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <MeshGradientBg color={accentColor} />

        <motion.div className="w-full max-w-md relative z-10" variants={containerVariants} initial="hidden" animate="visible">
          {/* Mobile branding */}
          <motion.div variants={itemVariants} className="lg:hidden flex flex-col items-center mb-8">
            <DynamicLogo color={accentColor} />
            <div className="text-center mt-2">
              <TypewriterText text="Campus Duty" color={accentColor} />
              <div className="h-6 flex items-center justify-center mt-2">
                <AnimatePresence mode="wait">
                  <motion.p key={tagIndex} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="text-sm text-muted-foreground">
                    {taglines[tagIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Glassmorphism card */}
          <motion.div
            variants={itemVariants}
            className="rounded-3xl p-6 lg:p-8 backdrop-blur-xl"
            style={{
              background: rgba(accentColor, 0.03),
              border: `1px solid ${rgba(accentColor, 0.1)}`,
              boxShadow: `0 20px 60px ${rgba(accentColor, 0.06)}, 0 1px 3px rgba(0,0,0,0.04)`,
            }}
          >
            {/* Desktop logo inside card */}
            <motion.div variants={itemVariants} className="hidden lg:flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: rgba(accentColor, 0.12), border: `1px solid ${rgba(accentColor, 0.15)}` }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              </div>
              <TypewriterText text="Campus Duty" color={accentColor} delay={0.3} />
            </motion.div>

            <motion.div variants={itemVariants} className="mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold">Welcome back</h2>
              <p className="text-muted-foreground mt-1.5 text-sm">Sign in to continue your academic journey</p>
            </motion.div>

            <GradientDivider color={accentColor} />

            <form onSubmit={handleSubmit} className="space-y-5 mt-5">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email" type="email" placeholder="your@mail.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email"
                  className="h-12 px-4 rounded-xl bg-background/50 transition-all"
                  style={{ borderColor: rgba(accentColor, 0.15) }}
                  onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 3px ${rgba(accentColor, 0.1)}`; }}
                  onBlur={(e) => { e.target.style.borderColor = rgba(accentColor, 0.15); e.target.style.boxShadow = 'none'; }}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="current-password"
                    className="h-12 px-4 pr-12 rounded-xl bg-background/50 transition-all"
                    style={{ borderColor: rgba(accentColor, 0.15) }}
                    onFocus={(e) => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 3px ${rgba(accentColor, 0.1)}`; }}
                    onBlur={(e) => { e.target.style.borderColor = rgba(accentColor, 0.15); e.target.style.boxShadow = 'none'; }}
                  />
                  <motion.button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" whileTap={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </motion.button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl text-white hover:scale-[1.02] transition-transform" disabled={isLoading} style={{ background: accentColor }}>
                  {isLoading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Signing in...</>) : 'Sign In'}
                </Button>
              </motion.div>
            </form>

            <GradientDivider color={accentColor} />

            <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground mt-4">
              New to Campus Duty?{' '}
              <Link to="/signup" className="font-semibold hover:underline" style={{ color: accentColor }}>
                Create an account
              </Link>
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;
