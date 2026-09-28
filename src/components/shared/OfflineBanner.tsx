import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, BookOpen } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-sm border-b border-amber-500/20">
            <WifiOff className="w-4 h-4" />
            <span>You're offline — showing cached data</span>
            <span className="mx-1">·</span>
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-xs">Notes, Schedule & Flashcards available</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
