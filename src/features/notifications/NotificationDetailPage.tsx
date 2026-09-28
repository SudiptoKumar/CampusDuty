import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Wrench, Megaphone, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { 
  useAppNotifications, 
  useMarkNotificationRead 
} from '@/hooks/useAppNotifications';
import { useEffect } from 'react';

const typeIcons = {
  update: Wrench,
  feature: Sparkles,
  announcement: Megaphone,
  maintenance: AlertTriangle,
};

const typeColors = {
  update: 'bg-blue-500/10 text-blue-500',
  feature: 'bg-primary/10 text-primary',
  announcement: 'bg-amber-500/10 text-amber-500',
  maintenance: 'bg-red-500/10 text-red-500',
};

const typeBgColors = {
  update: 'from-blue-500/5 to-blue-500/10',
  feature: 'from-primary/5 to-primary/10',
  announcement: 'from-amber-500/5 to-amber-500/10',
  maintenance: 'from-red-500/5 to-red-500/10',
};

export function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: notifications } = useAppNotifications();
  const markRead = useMarkNotificationRead();
  
  const notification = notifications?.find(n => n.id === id);
  
  useEffect(() => {
    if (notification) {
      markRead.mutate(notification.id);
    }
  }, [notification?.id]);
  
  if (!notification) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Notification not found</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }
  
  const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Megaphone;
  const colorClass = typeColors[notification.type as keyof typeof typeColors] || typeColors.announcement;
  const bgGradient = typeBgColors[notification.type as keyof typeof typeBgColors] || typeBgColors.announcement;
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-b ${bgGradient} p-4 pt-safe`}>
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Notification</h1>
        </div>
        
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass}`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold leading-tight">{notification.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(notification.created_at), 'EEEE, MMMM d, yyyy • h:mm a')}
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="surface-card p-5 rounded-2xl">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {notification.content}
          </p>
        </div>
        
        {/* Type badge */}
        <div className="flex justify-center mt-6">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${colorClass}`}>
            <Icon className="w-4 h-4" />
            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default NotificationDetailPage;
