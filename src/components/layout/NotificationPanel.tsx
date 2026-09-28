import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Sparkles, Wrench, Megaphone, AlertTriangle, Check, Heart, MessageCircle, Mail, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  useAppNotifications,
  useNotificationReads,
  useMarkNotificationRead,
  useUnreadNotificationCount,
} from '@/hooks/useAppNotifications';
import {
  usePersonalNotifications,
  usePersonalUnreadCount,
  useMarkPersonalNotificationsRead,
} from '@/hooks/usePersonalNotifications';

const typeIcons = {
  update: Wrench,
  feature: Sparkles,
  announcement: Megaphone,
  maintenance: AlertTriangle,
};

const typeColors = {
  update: 'text-blue-500',
  feature: 'text-primary',
  announcement: 'text-amber-500',
  maintenance: 'text-red-500',
};

const activityIcons = {
  message: Mail,
  reaction: Heart,
  comment: MessageCircle,
  new_post: FileText,
};

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'updates' | 'activity'>('activity');
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useAppNotifications();
  const { data: reads } = useNotificationReads();
  const markRead = useMarkNotificationRead();
  const systemUnreadCount = useUnreadNotificationCount();

  const { data: personalNotifications, isLoading: personalLoading } = usePersonalNotifications();
  const { data: personalUnreadCount = 0 } = usePersonalUnreadCount();
  const markPersonalRead = useMarkPersonalNotificationsRead();

  const totalUnread = systemUnreadCount + personalUnreadCount;
  
  const readIds = new Set(reads?.map(r => r.notification_id) || []);
  
  const handleNotificationClick = (notificationId: string) => {
    if (!readIds.has(notificationId)) {
      markRead.mutate(notificationId);
    }
    setOpen(false);
    navigate(`/notifications/${notificationId}`);
  };
  
  const handleMarkAllRead = () => {
    if (tab === 'updates') {
      notifications?.forEach(n => {
        if (!readIds.has(n.id)) markRead.mutate(n.id);
      });
    } else {
      markPersonalRead.mutate(undefined);
    }
  };

  const handlePersonalClick = (notification: any) => {
    if (!notification.is_read) {
      markPersonalRead.mutate([notification.id]);
    }
    setOpen(false);
    if (notification.type === 'message') {
      navigate('/classroom');
    } else if (notification.reference_id) {
      navigate('/classroom');
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-primary/10 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {totalUnread > 0 && (
            <>
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary animate-ping opacity-50" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        {/* Tab switcher */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('activity')}
            className={cn('flex-1 py-2.5 text-xs font-semibold text-center relative transition-colors',
              tab === 'activity' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Activity
            {personalUnreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                {personalUnreadCount > 9 ? '9+' : personalUnreadCount}
              </span>
            )}
            {tab === 'activity' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full bg-primary" />}
          </button>
          <button
            onClick={() => setTab('updates')}
            className={cn('flex-1 py-2.5 text-xs font-semibold text-center relative transition-colors',
              tab === 'updates' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Updates
            {systemUnreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                {systemUnreadCount > 9 ? '9+' : systemUnreadCount}
              </span>
            )}
            {tab === 'updates' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full bg-primary" />}
          </button>
        </div>

        {/* Mark all read */}
        {((tab === 'updates' && systemUnreadCount > 0) || (tab === 'activity' && personalUnreadCount > 0)) && (
          <div className="flex justify-end px-3 pt-2">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkAllRead}>
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          </div>
        )}
        
        <ScrollArea className="max-h-80">
          {tab === 'updates' ? (
            /* System notifications */
            isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : notifications?.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications?.map((notification) => {
                  const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
                  const isUnread = !readIds.has(notification.id);
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={cn('w-full p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer block', isUnread && 'bg-primary/5')}
                    >
                      <div className="flex gap-3">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', 'bg-muted/50', typeColors[notification.type as keyof typeof typeColors])}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm font-medium truncate', isUnread && 'text-foreground')}>{notification.title}</p>
                            {isUnread && <Badge variant="default" className="text-[10px] h-4 px-1">New</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            /* Personal activity notifications */
            personalLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : !personalNotifications?.length ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {personalNotifications.map((n) => {
                  const Icon = activityIcons[n.type as keyof typeof activityIcons] || Bell;
                  const label = n.type === 'message' ? 'sent you a message'
                    : n.type === 'reaction' ? `reacted ${n.content || ''} to your post`
                    : n.type === 'comment' ? 'commented on your post'
                    : 'posted something new';
                  return (
                    <button
                      key={n.id}
                      onClick={() => handlePersonalClick(n)}
                      className={cn('w-full p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer block', !n.is_read && 'bg-primary/5')}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={n.actor_avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {n.actor_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold">{n.actor_name || 'Someone'}</span>{' '}
                            <span className="text-muted-foreground">{label}</span>
                          </p>
                          {n.type === 'message' && n.content && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.content}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </ScrollArea>
        
        {/* View all link */}
        {tab === 'updates' && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => { setOpen(false); navigate('/whats-new'); }}
            >
              View all updates
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
