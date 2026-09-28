import { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Bell, Calendar, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { AddTaskForm } from '@/features/agenda/components/AddTaskForm';

interface FABProps {
  action: string;
  label: string;
}

interface QuickAddOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  taskType?: string;
}

const quickAddOptions: QuickAddOption[] = [
  { id: 'reminder', label: 'Reminder', icon: Bell, taskType: 'reminder' },
  { id: 'exam', label: 'Exam', icon: Calendar, taskType: 'exam' },
  { id: 'homework', label: 'Homework', icon: BookOpen, taskType: 'homework' },
];

export const FAB = forwardRef<HTMLButtonElement, FABProps>(({ action, label }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (action === 'quick') {
      setIsOpen(!isOpen);
    } else if (action === 'subject') {
      navigate('/subjects/add');
    } else if (action === 'teacher') {
      navigate('/teachers/add');
    } else if (action === 'class') {
      navigate('/timetable/add');
    } else if (action === 'note') {
      navigate('/notes/new');
    } else {
      setActiveForm(action);
    }
  };
  
  const handleQuickAdd = (option: QuickAddOption) => {
    setIsOpen(false);
    setSelectedTaskType(option.taskType || null);
    setActiveForm('task');
  };
  
  const handleClose = () => {
    setActiveForm(null);
    setSelectedTaskType(null);
  };
  
  const getFormTitle = () => {
    if (selectedTaskType === 'reminder') return 'Add Reminder';
    if (selectedTaskType === 'exam') return 'Add Exam';
    if (selectedTaskType === 'homework') return 'Add Homework';
    return 'Add Task';
  };

  return (
    <>
      {/* Backdrop overlay with fade animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            role="presentation"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      
      {/* Quick Add Options with spring animations */}
      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed right-4 bottom-24 z-50 flex flex-col items-end gap-3"
            role="menu"
            aria-label="Quick add options"
          >
            {quickAddOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleQuickAdd(option)}
                  className="flex items-center gap-3"
                  role="menuitem"
                  aria-label={`Add ${option.label}`}
                  initial={{ opacity: 0, x: 50, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: (quickAddOptions.length - 1 - index) * 0.05,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.span 
                    className="text-sm font-medium text-white/90 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (quickAddOptions.length - 1 - index) * 0.05 + 0.1 }}
                    aria-hidden="true"
                  >
                    {option.label}
                  </motion.span>
                  <div className="w-12 h-12 rounded-xl bg-muted/90 backdrop-blur-sm flex items-center justify-center shadow-lg border border-border/50">
                    <Icon className="w-5 h-5 text-foreground/80" aria-hidden="true" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>
      
      {/* FAB Button with rotation animation */}
      <motion.button
        ref={ref}
        onClick={handleClick}
        className="fab z-50"
        aria-label={isOpen ? 'Close quick add menu' : label}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
      </motion.button>
      
      {/* Form Modal/Sheet */}
      {isMobile ? (
        <Sheet open={!!activeForm} onOpenChange={(open) => !open && handleClose()}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
            <SheetHeader className="pb-4 flex-shrink-0">
              <SheetTitle>{getFormTitle()}</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto flex-1 min-h-0 pb-6">
              <AddTaskForm onClose={handleClose} defaultType={selectedTaskType} />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!activeForm} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{getFormTitle()}</DialogTitle>
            </DialogHeader>
            <AddTaskForm onClose={handleClose} defaultType={selectedTaskType} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

FAB.displayName = 'FAB';
