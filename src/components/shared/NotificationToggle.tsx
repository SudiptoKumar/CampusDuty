import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission,
  startNotificationChecks,
  stopNotificationChecks 
} from '@/lib/notifications';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export function NotificationToggle() {
  const { data: profile } = useProfile();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSupported, setIsSupported] = useState(true);
  
  useEffect(() => {
    setIsSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
  }, []);
  
  useEffect(() => {
    if (permission === 'granted') {
      startNotificationChecks(profile?.class_alert_minutes ?? 15);
    } else {
      stopNotificationChecks();
    }
    
    return () => stopNotificationChecks();
  }, [permission, profile?.class_alert_minutes]);
  
  const handleToggle = async () => {
    if (permission === 'granted') {
      toast.info('To disable notifications, use your browser settings');
      return;
    }
    
    const result = await requestNotificationPermission();
    setPermission(result);
    
    if (result === 'granted') {
      toast.success('Notifications enabled! You\'ll be notified about upcoming classes and tasks.');
    } else if (result === 'denied') {
      toast.error('Notification permission denied. Enable it in browser settings.');
    }
  };
  
  if (!isSupported) {
    return null;
  }
  
  const getIcon = () => {
    switch (permission) {
      case 'granted':
        return <BellRing className="w-5 h-5" />;
      case 'denied':
        return <BellOff className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };
  
  const getLabel = () => {
    switch (permission) {
      case 'granted':
        return 'Notifications On';
      case 'denied':
        return 'Notifications Blocked';
      default:
        return 'Enable Notifications';
    }
  };
  
  return (
    <Button 
      variant={permission === 'granted' ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleToggle}
      className="gap-2"
      disabled={permission === 'denied'}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getLabel()}</span>
    </Button>
  );
}
