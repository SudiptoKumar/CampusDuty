import { motion } from 'framer-motion';
import { CalendarDays, Sun, Sunrise, Moon } from 'lucide-react';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { usePermission } from '@/hooks/usePermission';
import { useClasses } from '@/hooks/useClasses';
import { useTasks } from '@/hooks/useTasks';
import { DashboardSkeleton } from '@/components/shared';
import { QuickNavTabs } from './components/QuickNavTabs';
import { useNewNotificationSound } from '@/hooks/useNewNotificationSound';
import {
  TodayClassesTile,
  PendingEventsTile,
  WeeklyReportTile,
  ClassroomInboxTile,
  StickyNotesTile,
  YearProgressTile,
  WeekScheduleList,
  MonthProgressTile,
  LiveClassTile,
  ExamCountdownTile,
} from './components/bento';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function BentoDashboard() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { isLoading: roleLoading } = usePermission('student');
  const { data: classes } = useClasses();
  const { data: tasks } = useTasks();
  
  // Enable notification sound
  useNewNotificationSound();
  
  const isLoading = profileLoading || roleLoading;
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const firstName = profile?.name?.split(' ')[0] || 'there';
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayClassCount = (classes ?? []).filter(c => c.day === dayOfWeek).length;
  const pendingTaskCount = (tasks ?? []).filter(t => !t.is_completed).length;
  
  return (
    <div className="relative p-4 md:p-6 lg:p-8 pb-24 max-w-4xl mx-auto liquid-glass mx-4 md:mx-auto mt-2 mb-8 overflow-hidden">
      {/* Liquid wallpaper */}
      <LiquidEffectAnimation metalness={0.6} roughness={0.3} displacementScale={3} />
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm z-[1]" />
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 relative z-[2]"
      >
        <h1 className="text-2xl font-bold">{getGreeting()}, {firstName}</h1>
        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
          {new Date().getHours() < 12 ? (
            <Sunrise className="w-4 h-4 text-amber-500" />
          ) : new Date().getHours() < 17 ? (
            <Sun className="w-4 h-4 text-yellow-500" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
          <span>{format(today, 'EEEE, MMMM d')}</span>
        </div>
      </motion.div>

      {/* Quick Nav Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 relative z-[2]"
      >
        <QuickNavTabs />
      </motion.div>
      
      {/* All tiles in relative z-2 */}
      <div className="relative z-[2] space-y-4">
      {/* 1. Weekly Report - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <WeeklyReportTile />
      </motion.div>
      
      {/* 2. Live Class Tile - Only shows when class is active/soon */}
      <div className="mb-4">
        <LiveClassTile />
      </div>
      
      {/* 3. Today's/Tomorrow's Classes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <TodayClassesTile />
      </motion.div>
      
      {/* 3. Classroom Inbox - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-4"
      >
        <ClassroomInboxTile />
      </motion.div>
      
      {/* 5. Pending Events */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <PendingEventsTile variant="today" />
      </motion.div>
      
      {/* 5.5. Exam Countdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-4"
      >
        <ExamCountdownTile />
      </motion.div>
      
      {/* 6. My Notes - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4"
      >
        <StickyNotesTile />
      </motion.div>
      
      {/* 7. Monthly Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-4"
      >
        <MonthProgressTile />
      </motion.div>
      
      {/* 8. Week Schedule (Sun-Thu) */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-4"
      >
        <WeekScheduleList />
      </motion.section>
      
      {/* 10. Year Progress - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <YearProgressTile />
      </motion.div>
      </div>{/* end z-2 wrapper */}
    </div>
  );
}

export default BentoDashboard;
