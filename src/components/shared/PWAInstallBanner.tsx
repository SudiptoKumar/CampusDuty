import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'pwa-install-shown';
const DELAY_MS = 60_000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('standalone' in window.navigator && (window.navigator as any).standalone);
    setIsIOS(ios);

    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener('beforeinstallprompt', handler);

    const timer = setTimeout(() => {
      if (deferredPrompt.current || ios) {
        setVisible(true);
      }
    }, DELAY_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      await deferredPrompt.current.userChoice;
      deferredPrompt.current = null;
    }
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[96] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="max-w-md mx-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="p-6 text-center">
                {/* App icon */}
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>

                <h2 className="text-lg font-bold mb-1">Install Campus Duty</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-[280px] mx-auto">
                  {isIOS
                    ? 'Add Campus Duty to your Home Screen for instant access and a native app experience.'
                    : 'Get quick access from your home screen with offline support and push notifications.'}
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-2.5">
                  {isIOS ? (
                    <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground text-left space-y-1.5">
                      <p className="font-medium text-foreground">How to install:</p>
                      <p>1. Tap the <strong>Share</strong> button in Safari</p>
                      <p>2. Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleInstall}
                      className="w-full h-12 rounded-xl text-sm font-semibold gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Install App
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={dismiss}
                    className="w-full h-10 rounded-xl text-sm text-muted-foreground"
                  >
                    Not now
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
