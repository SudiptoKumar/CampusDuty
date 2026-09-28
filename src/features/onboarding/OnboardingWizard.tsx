import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';
import { WelcomeStep } from './steps/WelcomeStep';
import { AcademicStep } from './steps/AcademicStep';
import { IdentityStep } from './steps/IdentityStep';
import { PersonalStep } from './steps/PersonalStep';
import { CompletionStep } from './steps/CompletionStep';

const TOTAL_STEPS = 5;

export function OnboardingWizard() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const markComplete = useCallback(() => {
    updateProfile.mutate({ profile_setup_completed: true } as any);
    setDismissed(true);
  }, [updateProfile]);

  // Don't show if profile not loaded, already completed, or dismissed
  if (!profile || profile.profile_setup_completed || dismissed) return null;

  const handleClose = () => markComplete();
  const handleSkip = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      markComplete();
    }
  };
  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      markComplete();
    }
  };

  const steps = [
    <WelcomeStep key="welcome" profile={profile} onNext={handleNext} />,
    <AcademicStep key="academic" profile={profile} onNext={handleNext} />,
    <IdentityStep key="identity" profile={profile} onNext={handleNext} />,
    <PersonalStep key="personal" profile={profile} onNext={handleNext} />,
    <CompletionStep key="completion" profile={profile} onComplete={markComplete} />,
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center overflow-hidden">
      <LiquidEffectAnimation metalness={0.7} roughness={0.3} displacementScale={3} />
      <div className="absolute inset-0 bg-background/90 z-[1]" />
      <div className="w-full max-w-lg mx-4 relative z-[2]">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8,
                background: i <= step ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              }}
            />
          ))}
        </div>

        {/* Step content with animation */}
        <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="p-6 sm:p-8"
            >
              {steps[step]}
            </motion.div>
          </AnimatePresence>

          {/* Footer with Skip */}
          {step < TOTAL_STEPS - 1 && (
            <div className="flex items-center justify-between px-6 sm:px-8 pb-6 sm:pb-8">
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                Skip
              </Button>
              <div className="text-xs text-muted-foreground">
                {step + 1} of {TOTAL_STEPS}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
