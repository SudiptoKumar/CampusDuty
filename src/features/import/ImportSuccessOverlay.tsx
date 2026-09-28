import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

interface ImportSuccessOverlayProps {
  imported: {
    subjects: number;
    teachers: number;
    classes: number;
  };
}

export function ImportSuccessOverlay({ imported }: ImportSuccessOverlayProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Fire confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['subjects'] });
    queryClient.invalidateQueries({ queryKey: ['teachers'] });
    queryClient.invalidateQueries({ queryKey: ['classes'] });

    // Auto-dismiss after 2 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, queryClient]);

  const total = imported.subjects + imported.teachers + imported.classes;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 mb-4 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <h2 className="font-bold text-base">Import Complete!</h2>
              <p className="text-xs text-muted-foreground">
                {total} {total === 1 ? 'item' : 'items'} imported
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {imported.subjects > 0 && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-sm font-medium">
                {imported.subjects} {imported.subjects === 1 ? 'Subject' : 'Subjects'}
              </span>
            )}
            {imported.teachers > 0 && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-sm font-medium">
                {imported.teachers} {imported.teachers === 1 ? 'Teacher' : 'Teachers'}
              </span>
            )}
            {imported.classes > 0 && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-sm font-medium">
                {imported.classes} {imported.classes === 1 ? 'Class' : 'Classes'}
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
