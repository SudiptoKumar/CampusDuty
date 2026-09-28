import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSharedLinkByCode } from '@/hooks/useSharedLinks';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import ImportPage from './ImportPage';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';

/* ── Floating Orbs Background ── */
function FloatingOrbs() {
  const orbs = [
    { size: 280, x: '15%', y: '20%', color: 'hsl(var(--primary) / 0.12)', duration: 18, delay: 0 },
    { size: 200, x: '75%', y: '15%', color: 'hsl(var(--accent-lavender) / 0.10)', duration: 22, delay: 2 },
    { size: 240, x: '60%', y: '65%', color: 'hsl(var(--accent-sky) / 0.08)', duration: 20, delay: 4 },
    { size: 160, x: '25%', y: '75%', color: 'hsl(var(--accent-peach) / 0.10)', duration: 16, delay: 1 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full will-change-transform"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -25, 15, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated Icon with Glow Ring ── */
function AnimatedIcon() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
      className="relative"
    >
      {/* Pulsing glow ring */}
      <motion.div
        className="absolute -inset-3 rounded-3xl"
        style={{ background: 'hsl(var(--primary) / 0.15)' }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -inset-1.5 rounded-2xl"
        style={{ background: 'hsl(var(--primary) / 0.1)' }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <div className="relative w-20 h-20 rounded-2xl bg-primary/15 backdrop-blur-xl flex items-center justify-center border border-primary/20">
        <KeyRound className="w-9 h-9 text-primary" />
      </div>
    </motion.div>
  );
}

/* ── Stagger container variants ── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

export function ImportByCodePage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const { data: sharedLink, isLoading, error, isFetched } = useSharedLinkByCode(code.length === 6 ? code : null);

  if (sharedLink) {
    return <ImportPage sharedLinkOverride={sharedLink} />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ── Guest View ── */
  if (!user) {
    const handleCreateAccount = () => {
      if (code.length === 6) localStorage.setItem('pending-import-code', code);
      navigate('/signup');
    };
    const handleSignIn = () => {
      if (code.length === 6) localStorage.setItem('pending-import-code', code);
      navigate('/login');
    };

    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-background p-4 overflow-hidden">
        <LiquidEffectAnimation />
        <div className="absolute inset-0 bg-background/40 z-[1]" />

        <motion.div
          className="relative z-10 w-full max-w-md text-center space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="flex justify-center">
            <AnimatedIcon />
          </motion.div>

          <motion.div variants={itemVariants}>
            <h1 className="text-2xl font-bold mb-2">Enter Share Code</h1>
            <p className="text-muted-foreground">
              Enter the 6-digit code to import shared data. Create a free account to get started.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode} inputMode="numeric" pattern="[0-9]*">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </motion.div>

          <AnimatePresence mode="wait">
            {code.length === 6 ? (
              <motion.div
                key="buttons"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="flex flex-col gap-3"
              >
                <Button onClick={handleCreateAccount} className="w-full h-12 text-base hover:scale-[1.02] transition-transform">
                  Create Account & Import
                </Button>
                <Button variant="outline" onClick={handleSignIn} className="w-full hover:scale-[1.02] transition-transform">
                  I already have an account
                </Button>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground"
              >
                Enter all 6 digits to continue
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  /* ── Authenticated View ── */
  const showError = code.length === 6 && isFetched && !isLoading && !sharedLink;

  return (
    <div className="min-h-screen relative bg-background p-4 overflow-hidden">
      <LiquidEffectAnimation />
      <div className="absolute inset-0 bg-background/40 z-[1]" />

      <div className="relative z-10 max-w-lg mx-auto pt-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <motion.div
          className="text-center mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <AnimatedIcon />
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-2xl font-bold mb-2"
          >
            Enter Share Code
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-muted-foreground"
          >
            Enter the 6-digit code to import shared data
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className={cn(showError && 'animate-shake')}
          >
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              inputMode="numeric"
              pattern="[0-9]*"
            >
              <InputOTPGroup className={cn(showError && '[&>div]:border-destructive [&>div]:shadow-[0_0_12px_hsl(0_72%_51%/0.2)]')}>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </motion.div>

          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Looking up code...</span>
              </motion.div>
            )}

            {showError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">Invalid or expired code. Please try again.</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCode('')}
                  className="hover:scale-[1.02] transition-transform"
                >
                  Clear & Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default ImportByCodePage;
