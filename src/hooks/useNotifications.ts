import { useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { 
  getNotificationPermission, 
  startNotificationChecks, 
  stopNotificationChecks 
} from '@/lib/notifications';

/**
 * Hook that automatically starts notification checks when user is logged in
 * and has granted notification permission.
 */
export function useNotifications() {
  const { data: profile } = useProfile();
  
  useEffect(() => {
    const permission = getNotificationPermission();
    
    if (permission === 'granted' && profile) {
      startNotificationChecks(profile.class_alert_minutes ?? 15);
    }
    
    return () => {
      stopNotificationChecks();
    };
  }, [profile]);
}
