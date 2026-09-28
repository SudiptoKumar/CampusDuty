import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth';
import { useTasks } from './useTasks';
import { useAttendance } from './useAttendance';
import { useSubjects } from './useSubjects';
import { useClasses } from './useClasses';
import { useTeachers } from './useTeachers';
import { useGrades } from './useGrades';
import { useNotes } from './useNotes';
import { useGoals } from './useGoals';
import { useProfile } from './useProfile';
import { useClassroomPosts } from './useClassroomPosts';
import { useEffect } from 'react';
import { format, subDays } from 'date-fns';

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
}

export interface AchievementDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

// 20 easily gainable achievements
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Welcome
  { key: 'welcome', title: 'Welcome', description: 'Created your account', icon: '👋', color: '#10b981' },
  
  // Subjects
  { key: 'first_subject', title: 'First Steps', description: 'Added your first subject', icon: '📚', color: '#3b82f6' },
  { key: 'subjects_5', title: 'Scholar', description: 'Added 5 subjects', icon: '🎓', color: '#8b5cf6' },
  
  // Classes
  { key: 'first_class', title: 'Time Keeper', description: 'Scheduled your first class', icon: '⏰', color: '#f59e0b' },
  { key: 'classes_10', title: 'Well Organized', description: 'Scheduled 10 classes', icon: '📅', color: '#14b8a6' },
  
  // Tasks
  { key: 'first_task', title: 'Task Started', description: 'Created your first task', icon: '📝', color: '#6366f1' },
  { key: 'tasks_5', title: 'Getting Started', description: 'Completed 5 tasks', icon: '✅', color: '#22c55e' },
  { key: 'tasks_25', title: 'Productivity Pro', description: 'Completed 25 tasks', icon: '⚡', color: '#eab308' },
  
  // Teachers
  { key: 'first_teacher', title: 'Connected', description: 'Added your first teacher', icon: '👨‍🏫', color: '#0ea5e9' },
  
  // Grades
  { key: 'first_grade', title: 'Graded', description: 'Recorded your first grade', icon: '📊', color: '#f97316' },
  
  // Attendance
  { key: 'first_attendance', title: 'Present', description: 'Marked your first attendance', icon: '📋', color: '#06b6d4' },
  
  // Notes
  { key: 'first_note', title: 'Note Taker', description: 'Created your first note', icon: '🗒️', color: '#a855f7' },
  
  // Goals
  { key: 'first_goal', title: 'Goal Setter', description: 'Created your first goal', icon: '🎯', color: '#ec4899' },
  { key: 'goal_complete', title: 'Goal Getter', description: 'Completed your first goal', icon: '🏆', color: '#f59e0b' },
  
  // Streaks
  { key: 'streak_3', title: 'On Fire', description: '3-day visit streak', icon: '🔥', color: '#ef4444' },
  { key: 'streak_7', title: 'Week Warrior', description: '7-day visit streak', icon: '💪', color: '#f97316' },
  { key: 'streak_14', title: 'Fortnight Fighter', description: '14-day visit streak', icon: '⚡', color: '#eab308' },
  { key: 'streak_30', title: 'Monthly Master', description: '30-day visit streak', icon: '🌟', color: '#84cc16' },
  
  // Profile
  { key: 'profile_complete', title: 'Identity Set', description: 'Completed your profile', icon: '🪪', color: '#6366f1' },
  { key: 'social_added', title: 'Social Butterfly', description: 'Added social links', icon: '🦋', color: '#ec4899' },

  // Posts
  { key: 'first_post', title: 'First Voice', description: 'Published your first post', icon: '📢', color: '#3b82f6' },
  { key: 'posts_5', title: 'Active Contributor', description: 'Published 5 posts', icon: '✍️', color: '#8b5cf6' },
  { key: 'posts_10', title: 'Prolific Writer', description: 'Published 10 posts', icon: '📰', color: '#f59e0b' },
  { key: 'posts_20', title: 'Community Pillar', description: 'Published 20 posts', icon: '🏛️', color: '#10b981' },
];

export function useAchievements() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('unlocked_at', { ascending: false });
      
      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!user?.id,
  });
}

export function useUnlockAchievement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (achievementKey: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Check if already unlocked
      const { data: existing } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('achievement_key', achievementKey)
        .maybeSingle();
      
      if (existing) return null; // Already unlocked
      
      const { data, error } = await supabase
        .from('achievements')
        .insert({
          user_id: user.id,
          achievement_key: achievementKey,
        })
        .select()
        .single();
      
      if (error && error.code !== '23505') throw error; // Ignore unique constraint violations
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['achievements'] });
        const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.key === data.achievement_key);
        if (def) {
          // Fire confetti celebration
          import('@/hooks/useConfetti').then(({ fireConfetti }) => {
            fireConfetti();
          });
          
          // Show achievement toast
          import('sonner').then(({ toast }) => {
            toast.success(`🏆 Achievement Unlocked: ${def.title}`, {
              description: def.description,
              duration: 5000,
            });
          });
        }
      }
    },
  });
}

export function useAchievementChecker() {
  const { user } = useAuth();
  const { data: tasks } = useTasks();
  const { data: attendance } = useAttendance();
  const { data: achievements } = useAchievements();
  const { data: subjects } = useSubjects();
  const { data: classes } = useClasses();
  const { data: teachers } = useTeachers();
  const { data: grades } = useGrades();
  const { data: notes } = useNotes();
  const { data: goals } = useGoals();
  const { data: profile } = useProfile();
  const { mutate: unlock } = useUnlockAchievement();
  const { data: classroomPosts } = useClassroomPosts();
  const queryClient = useQueryClient();
  
  // Track visit streak on mount and unlock welcome achievement
  useEffect(() => {
    if (!user?.id) return;
    
    const updateVisitStreak = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('last_visit_date, visit_streak, total_visits')
        .eq('user_id', user.id)
        .single();
      
      if (!profileData) return;
      
      const lastVisit = profileData.last_visit_date;
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      let newStreak = profileData.visit_streak;
      
      if (lastVisit === today) {
        // Already visited today
        return;
      } else if (lastVisit === yesterday) {
        // Consecutive day
        newStreak = profileData.visit_streak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
      
      await supabase
        .from('profiles')
        .update({
          last_visit_date: today,
          visit_streak: newStreak,
          total_visits: profileData.total_visits + 1,
        })
        .eq('user_id', user.id);
      
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Check streak achievements
      if (newStreak >= 3) unlock('streak_3');
      if (newStreak >= 7) unlock('streak_7');
      if (newStreak >= 14) unlock('streak_14');
      if (newStreak >= 30) unlock('streak_30');
      
      // Unlock welcome achievement on first visit
      if (profileData.total_visits === 0) {
        unlock('welcome');
      }
    };
    
    updateVisitStreak();
  }, [user?.id]);
  
  // Check task achievements
  useEffect(() => {
    if (!tasks || !achievements) return;
    
    const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
    const taskCount = tasks.length;
    const completedCount = tasks.filter((t) => t.is_completed).length;
    
    // First task created
    if (taskCount >= 1 && !unlockedKeys.has('first_task')) unlock('first_task');
    
    // Task completion milestones
    if (completedCount >= 5 && !unlockedKeys.has('tasks_5')) unlock('tasks_5');
    if (completedCount >= 25 && !unlockedKeys.has('tasks_25')) unlock('tasks_25');
  }, [tasks, achievements]);
  
  // Check subject achievements
  useEffect(() => {
    if (!subjects || !achievements) return;
    
    const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
    
    if (subjects.length >= 1 && !unlockedKeys.has('first_subject')) unlock('first_subject');
    if (subjects.length >= 5 && !unlockedKeys.has('subjects_5')) unlock('subjects_5');
  }, [subjects, achievements]);
  
  // Check class achievements
  useEffect(() => {
    if (!classes || !achievements) return;
    
    const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
    
    if (classes.length >= 1 && !unlockedKeys.has('first_class')) unlock('first_class');
    if (classes.length >= 10 && !unlockedKeys.has('classes_10')) unlock('classes_10');
  }, [classes, achievements]);
  
  // Check teacher achievements
  useEffect(() => {
    if (!teachers || !achievements) return;
    
    const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
    
    if (teachers.length >= 1 && !unlockedKeys.has('first_teacher')) unlock('first_teacher');
  }, [teachers, achievements]);
  
  // Check grade achievements
  useEffect(() => {
    if (!grades || !achievements) return;
    
    const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
    
    if (grades.length >= 1 && !unlockedKeys.has('first_grade')) unlock('first_grade');
  }, [grades, achievements]);
  
  // Check attendance achievements
  useEffect(() => {
    if (!attendance || !achievements) return;
    
    const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
    
    if (attendance.length >= 1 && !unlockedKeys.has('first_attendance')) unlock('first_attendance');
  }, [attendance, achievements]);
  
  // Check note achievements
  useEffect(() => {
    if (!notes || !achievements) return;
    
    const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
    
    if (notes.length >= 1 && !unlockedKeys.has('first_note')) unlock('first_note');
  }, [notes, achievements]);
  
  // Check goal achievements
  useEffect(() => {
    if (!goals || !achievements) return;
    
    const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
    
    if (goals.length >= 1 && !unlockedKeys.has('first_goal')) unlock('first_goal');
    
    const completedGoals = goals.filter((g) => g.is_completed);
    if (completedGoals.length >= 1 && !unlockedKeys.has('goal_complete')) unlock('goal_complete');
  }, [goals, achievements]);
  
  // Check profile achievements
  useEffect(() => {
    if (!profile || !achievements) return;
    
    const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
    
    // Profile complete: has username, bio, and avatar
    const isProfileComplete = !!(profile.username && profile.bio && profile.avatar_url);
    if (isProfileComplete && !unlockedKeys.has('profile_complete')) unlock('profile_complete');
    
    // Social links added
    const socialLinks = profile.social_links as Record<string, string> | null;
    const hasSocialLinks = socialLinks && Object.values(socialLinks).some(v => v && v.trim().length > 0);
    if (hasSocialLinks && !unlockedKeys.has('social_added')) unlock('social_added');
  }, [profile, achievements]);

  // Check post achievements
  useEffect(() => {
    if (!classroomPosts || !achievements || !user?.id) return;
    
    const unlockedKeys = new Set(achievements.map((a) => a.achievement_key));
    const myPosts = classroomPosts.filter(p => p.user_id === user.id);
    
    if (myPosts.length >= 1 && !unlockedKeys.has('first_post')) unlock('first_post');
    if (myPosts.length >= 5 && !unlockedKeys.has('posts_5')) unlock('posts_5');
    if (myPosts.length >= 10 && !unlockedKeys.has('posts_10')) unlock('posts_10');
    if (myPosts.length >= 20 && !unlockedKeys.has('posts_20')) unlock('posts_20');
  }, [classroomPosts, achievements, user?.id]);
}
