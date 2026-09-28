import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, CheckCircle2, Calendar, Users, Download } from 'lucide-react';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  PALETTE, rgba, MeshGradientBg, DynamicLogo, TypewriterText, GradientDivider,
  containerVariants, itemVariants,
} from '@/components/shared/BrandAnimations';

const PENDING_TOKEN_KEY = 'pending-import-token';
const PENDING_CODE_KEY = 'pending-import-code';

const benefits = [
  { icon: CheckCircle2, label: '100% Free to Use' },
  { icon: Calendar, label: 'Sync Across All Devices' },
  { icon: Users, label: 'Share with Classmates' },
];

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const accentColor = useMemo(() => PALETTE[Math.floor(Math.random() * PALETTE.length)], []);
  const hasPendingImport = !!(localStorage.getItem(PENDING_TOKEN_KEY) || localStorage.getItem(PENDING_CODE_KEY));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    const { error } = await signUp(email, password, name);
    if (error) { toast.error(error.message || 'Failed to create account'); setIsLoading(false); }
    else {
      toast.success('Account created! Setting up your profile...');
      // Brief delay to let profile creation complete before onboarding reads it
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/');
    }
  };

  const passwordStrength = password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak';

  const inputStyle = { borderColor: rgba(accentColor, 0.15) };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 3px ${rgba(accentColor, 0.1)}`; };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = rgba(accentColor, 0.15); e.target.style.boxShadow = 'none'; };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left Panel - Desktop */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <LiquidEffectAnimation />
        <div className="absolute inset-0 bg-black/30" style={{ zIndex: 1 }} />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <DynamicLogo color="#ffffff" />
          </motion.div>
          <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-3">
              Start Your<br /><span className="text-white/80">Academic Journey</span>
            </h2>
            <p className="text-lg text-white/70">Join thousands of students organizing their academic life.</p>
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
          <motion.div variants={itemVariants} className="lg:hidden flex flex-col items-center mb-6">
            <DynamicLogo color={accentColor} />
            <div className="text-center mt-2">
              <TypewriterText text="Campus Duty" color={accentColor} />
              <motion.p className="text-xs text-muted-foreground mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
                Your Academic Companion
              </motion.p>
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
            {/* Desktop logo */}
            <motion.div variants={itemVariants} className="hidden lg:flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: rgba(accentColor, 0.12), border: `1px solid ${rgba(accentColor, 0.15)}` }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              </div>
              <TypewriterText text="Campus Duty" color={accentColor} delay={0.3} />
            </motion.div>

            <motion.div variants={itemVariants} className="mb-5">
              <h2 className="text-2xl lg:text-3xl font-bold">Create your account</h2>
              <p className="text-muted-foreground mt-1 text-sm">Fill in your details to get started</p>
            </motion.div>

            {hasPendingImport && (
              <motion.div variants={itemVariants} className="mb-4 p-3 rounded-xl flex items-center gap-3" style={{ background: rgba(accentColor, 0.05), border: `1px solid ${rgba(accentColor, 0.2)}` }}>
                <Download className="w-5 h-5 shrink-0" style={{ color: accentColor }} />
                <p className="text-sm"><span className="font-medium">Shared timetable waiting!</span>{' '}<span className="text-muted-foreground">It'll be imported after sign up.</span></p>
              </motion.div>
            )}

            <GradientDivider color={accentColor} />

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
                <Input id="name" type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="h-12 px-4 rounded-xl bg-background/50 transition-all" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input id="email" type="email" placeholder="your@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-12 px-4 rounded-xl bg-background/50 transition-all" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={6} className="h-12 px-4 pr-12 rounded-xl bg-background/50 transition-all" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: rgba(accentColor, 0.1) }}>
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '66%' : '33%', background: passwordStrength === 'strong' ? '#22C55E' : passwordStrength === 'medium' ? '#F59E0B' : '#F43F5E' }} />
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{passwordStrength}</span>
                  </div>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</Label>
                <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className="h-12 px-4 rounded-xl bg-background/50 transition-all" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords don't match</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl text-white hover:scale-[1.02] transition-transform" disabled={isLoading} style={{ background: accentColor }}>
                  {isLoading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating account...</>) : 'Create Account'}
                </Button>
              </motion.div>
            </form>

            <GradientDivider color={accentColor} />

            <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: accentColor }}>Sign in</Link>
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default SignupPage;
