import { useEffect, useRef } from 'react';
import { useUnreadClassroomPosts } from '@/hooks/useUnreadClassroomPosts';
import { useUnreadNotificationCount } from '@/hooks/useAppNotifications';

const SOUND_PLAYED_KEY = 'notification_sound_last_played';
const SOUND_COOLDOWN = 30000; // 30 seconds cooldown between sounds

export function useNewNotificationSound() {
  const { data: classroomData } = useUnreadClassroomPosts();
  const unreadNotificationCount = useUnreadNotificationCount();
  const hasPlayedRef = useRef(false);
  
  useEffect(() => {
    const totalUnread = (classroomData?.unreadCount || 0) + unreadNotificationCount;
    
    if (totalUnread > 0 && !hasPlayedRef.current) {
      const lastPlayed = localStorage.getItem(SOUND_PLAYED_KEY);
      const now = Date.now();
      
      // Only play if cooldown has passed
      if (!lastPlayed || now - parseInt(lastPlayed, 10) > SOUND_COOLDOWN) {
        // Create a simple notification sound using Web Audio API
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Pleasant notification tone
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          
          localStorage.setItem(SOUND_PLAYED_KEY, now.toString());
          hasPlayedRef.current = true;
        } catch (e) {
          // Audio not supported or blocked
          console.log('Notification sound not played:', e);
        }
      }
    }
  }, [classroomData?.unreadCount, unreadNotificationCount]);
}
