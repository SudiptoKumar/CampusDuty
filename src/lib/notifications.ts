import { supabase } from '@/integrations/supabase/client';

// Check if browser supports notifications
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  
  const permission = await Notification.requestPermission();
  return permission;
}

// Show a notification
export function showNotification(title: string, options?: NotificationOptions): void {
  if (getNotificationPermission() !== 'granted') return;
  
  // Use service worker for notifications when available
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    });
  } else {
    // Fallback to regular notification
    new Notification(title, {
      icon: '/pwa-192x192.png',
      ...options,
    });
  }
}

// Format time for display
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Check for upcoming classes and send notifications
export async function checkUpcomingClasses(alertMinutes: number = 15): Promise<void> {
  if (getNotificationPermission() !== 'granted') return;
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const { data: classes } = await supabase
    .from('classes')
    .select('*, subjects(name, color)')
    .eq('day', dayOfWeek);
  
  if (!classes) return;
  
  for (const classItem of classes) {
    const [hours, minutes] = classItem.start_time.split(':').map(Number);
    const classMinutes = hours * 60 + minutes;
    const minutesUntilClass = classMinutes - currentMinutes;
    
    // Check if class is coming up within the alert window
    if (minutesUntilClass > 0 && minutesUntilClass <= alertMinutes) {
      const notificationKey = `class-${classItem.id}-${now.toDateString()}`;
      const alreadyNotified = localStorage.getItem(notificationKey);
      
      if (!alreadyNotified) {
        const subjectName = (classItem as any).subjects?.name || 'Class';
        showNotification(`${subjectName} in ${minutesUntilClass} minutes`, {
          body: classItem.room ? `Room: ${classItem.room}` : `Starts at ${formatTime(classItem.start_time)}`,
          tag: notificationKey,
        });
        localStorage.setItem(notificationKey, 'true');
      }
    }
  }
}

// Check for upcoming task deadlines
export async function checkUpcomingTasks(): Promise<void> {
  if (getNotificationPermission() !== 'granted') return;
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, subjects(name)')
    .eq('is_completed', false)
    .gte('due_date', today)
    .lte('due_date', tomorrow);
  
  if (!tasks) return;
  
  for (const task of tasks) {
    const notificationKey = `task-${task.id}-${today}`;
    const alreadyNotified = localStorage.getItem(notificationKey);
    
    if (!alreadyNotified) {
      const dueDate = new Date(task.due_date);
      const isToday = task.due_date === today;
      const subjectName = (task as any).subjects?.name;
      
      showNotification(
        isToday ? `Due Today: ${task.title}` : `Due Tomorrow: ${task.title}`,
        {
          body: subjectName ? `Subject: ${subjectName}` : 'Don\'t forget to complete this task!',
          tag: notificationKey,
        }
      );
      localStorage.setItem(notificationKey, 'true');
    }
  }
}

// Show notification for new classroom post
export function showClassroomPostNotification(authorName: string, contentPreview: string): void {
  if (getNotificationPermission() !== 'granted') return;
  
  const notificationKey = `classroom-post-${Date.now()}`;
  
  showNotification(`📢 New Announcement from ${authorName}`, {
    body: contentPreview.length > 100 ? contentPreview.slice(0, 100) + '...' : contentPreview,
    tag: notificationKey,
    data: { url: '/classroom' },
  });
}

// Start periodic notification checks
let checkInterval: NodeJS.Timeout | null = null;

export function startNotificationChecks(alertMinutes: number = 15): void {
  if (checkInterval) return;
  
  // Check immediately
  checkUpcomingClasses(alertMinutes);
  checkUpcomingTasks();
  
  // Then check every minute
  checkInterval = setInterval(() => {
    checkUpcomingClasses(alertMinutes);
    checkUpcomingTasks();
  }, 60 * 1000);
}

export function stopNotificationChecks(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
