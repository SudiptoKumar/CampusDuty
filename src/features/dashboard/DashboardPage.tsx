import { useState, useEffect, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { Clock, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useSubjects } from '@/hooks/useSubjects';
import { useClasses } from '@/hooks/useClasses';
import { useTasks } from '@/hooks/useTasks';
import { useAchievementChecker } from '@/hooks/useAchievements';
import { QuickNavTabs, TiltCard, DashboardSkeleton } from '@/components/shared';
import { 
  CurrentClassCard, 
  ClassStartingSoonBanner, 
  WeeklyOverviewWidget,
  TodayScheduleWidget,
  TomorrowScheduleWidget,
  QuickStatsWidget,
  StudyStreakWidget,
  YearProgressWidget,
  SubjectProgressWidget,
  UpcomingDeadlinesWidget,
  MonthlyHeatmapWidget,
  MotivationalQuoteWidget,
  GoalsWidget,
  AchievementsWidget,
} from './components';

export function DashboardPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  
  // Track achievements automatically
  useAchievementChecker();
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };

    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayOfWeek = today.getDay();
  const tomorrowDayOfWeek = tomorrow.getDay();
  
  const isLoading = profileLoading || subjectsLoading || classesLoading || tasksLoading;
  
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const todaysClasses = useMemo(() => {
    return (classes ?? [])
      .filter((c) => c.day === dayOfWeek)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  }, [classes, dayOfWeek]);
  
  const currentClass = useMemo(() => {
    return todaysClasses.find((c) => {
      const start = timeToMinutes(c.start_time);
      const end = timeToMinutes(c.end_time);
      return currentMinutes >= start && currentMinutes < end;
    });
  }, [todaysClasses, currentMinutes]);
  
  const upcomingClasses = useMemo(() => {
    return todaysClasses.filter((c) => {
      const start = timeToMinutes(c.start_time);
      return start > currentMinutes || (currentClass && c.id === currentClass.id ? false : timeToMinutes(c.end_time) > currentMinutes);
    }).filter((c) => c.id !== currentClass?.id);
  }, [todaysClasses, currentMinutes, currentClass]);
  
  const tomorrowsClasses = (classes ?? [])
    .filter((c) => c.day === tomorrowDayOfWeek)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  
  const getSubject = (id: string) => subjects?.find((s) => s.id === id);
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 space-y-5 pb-24">
      {/* Greeting Section - Warmer & More Personal */}
      <section className="stagger-item">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {profile?.name ? `Hey, ${profile.name.split(' ')[0]} 👋` : 'Welcome back! 👋'}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {format(today, 'EEEE, MMMM d')} • {getGreeting()}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation Tabs */}
      <QuickNavTabs />

      {/* Weekly Overview Widget - Premium Animated Version */}
      <section className="stagger-item">
        <WeeklyOverviewWidget />
      </section>

      {/* Class Starting Soon Banner */}
      {subjects && classes && !currentClass && (
        <ClassStartingSoonBanner
          classes={classes}
          subjects={subjects}
          alertMinutes={profile?.class_alert_minutes ?? 5}
        />
      )}

      {/* Current Class - Right Now */}
      {currentClass && getSubject(currentClass.subject_id) && (
        <section className="stagger-item">
          <CurrentClassCard 
            classItem={currentClass} 
            subject={getSubject(currentClass.subject_id)!}
            type="current"
          />
        </section>
      )}

      {/* Upcoming Classes Today */}
      {upcomingClasses.length > 0 ? (
        <section className="stagger-item surface-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Upcoming Classes</span>
            <span className="text-xs text-muted-foreground ml-auto">{upcomingClasses.length} today</span>
          </div>
          
          <div className="space-y-2">
            {upcomingClasses.slice(0, 3).map((classItem) => {
              const subject = getSubject(classItem.subject_id);
              if (!subject) return null;
              return (
                <TiltCard key={classItem.id} tiltAmount={5} className="rounded-xl">
                  <div 
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                  >
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(classItem.start_time)} – {formatTime(classItem.end_time)}
                        {classItem.room && ` • ${classItem.room}`}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
          
          {upcomingClasses.length > 3 && (
            <Link to="/timetable" className="text-xs text-primary font-medium flex items-center gap-1 mt-3 hover:gap-2 transition-all">
              View all classes
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </section>
      ) : todaysClasses.length === 0 && (
        <section className="stagger-item surface-card p-4 text-center">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No classes today</p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Set up your timetable to see your daily schedule
          </p>
          <Link 
            to="/timetable" 
            className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-3 hover:underline"
          >
            Go to Timetable
            <ArrowRight className="w-3 h-3" />
          </Link>
        </section>
      )}

      {/* Today & Tomorrow Schedule */}
      <section className="stagger-item grid grid-cols-1 md:grid-cols-2 gap-4">
        <TodayScheduleWidget />
        <TomorrowScheduleWidget />
      </section>

      {/* Tomorrow's Classes Preview */}
      {tomorrowsClasses.length > 0 && (
        <section className="stagger-item surface-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">Tomorrow's Classes</span>
            <span className="text-xs text-muted-foreground ml-auto">{tomorrowsClasses.length} classes</span>
          </div>
          
          <div className="space-y-2">
            {tomorrowsClasses.slice(0, 3).map((classItem) => {
              const subject = getSubject(classItem.subject_id);
              if (!subject) return null;
              return (
                <div key={classItem.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                  <span className="text-xs text-muted-foreground w-14 font-medium">
                    {formatTime(classItem.start_time)}
                  </span>
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.name.charAt(0)}
                  </div>
                  <span className="text-sm truncate flex-1">{subject.name}</span>
                </div>
              );
            })}
            {tomorrowsClasses.length > 3 && (
              <Link to="/timetable" className="text-xs text-muted-foreground hover:text-primary font-medium flex items-center gap-1 mt-2">
                +{tomorrowsClasses.length - 3} more
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Motivational Quote */}
      <section className="stagger-item">
        <MotivationalQuoteWidget />
      </section>

      {/* Goals & Achievements */}
      <section className="stagger-item grid grid-cols-1 md:grid-cols-2 gap-4">
        <GoalsWidget />
        <AchievementsWidget />
      </section>

      {/* Analytics Widgets Section */}
      <section className="stagger-item space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground px-1">Insights</h2>
        
        {/* Quick Stats */}
        <QuickStatsWidget />
        
        {/* Streak & Deadlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StudyStreakWidget />
          <UpcomingDeadlinesWidget />
        </div>
        
        {/* Subject Progress */}
        <SubjectProgressWidget />
        
        {/* Monthly Heatmap */}
        <MonthlyHeatmapWidget />
        
        {/* Year Progress - GitHub Style */}
        <YearProgressWidget />
      </section>
    </div>
    </>
  );
}

export default DashboardPage;
