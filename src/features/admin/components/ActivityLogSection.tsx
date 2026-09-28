import { format } from 'date-fns';
import { 
  Activity, 
  UserCheck, 
  UserX, 
  Bell, 
  FileText,
  Trash2,
  Pin,
  Clock
} from 'lucide-react';
import { useAllAppNotifications } from '@/hooks/useAppNotifications';
import { useClassroomPosts } from '@/hooks/useClassroomPosts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityItem {
  id: string;
  type: 'notification' | 'post' | 'pin';
  action: string;
  description: string;
  timestamp: string;
  icon: typeof Activity;
  iconColor: string;
}

export function ActivityLogSection() {
  const { data: notifications } = useAllAppNotifications();
  const { data: posts } = useClassroomPosts();

  // Build activity items from available data
  const activities: ActivityItem[] = [];

  // Add notifications as activity
  notifications?.forEach(notification => {
    activities.push({
      id: `notification-${notification.id}`,
      type: 'notification',
      action: 'Notification Sent',
      description: `"${notification.title}" - ${notification.type}`,
      timestamp: notification.created_at,
      icon: Bell,
      iconColor: 'text-orange-500',
    });
  });

  // Add posts as activity
  posts?.forEach(post => {
    activities.push({
      id: `post-${post.id}`,
      type: 'post',
      action: post.is_pinned ? 'Post Pinned' : 'Post Created',
      description: `By ${post.author?.name || 'Unknown'}: "${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}"`,
      timestamp: post.created_at,
      icon: post.is_pinned ? Pin : FileText,
      iconColor: post.is_pinned ? 'text-primary' : 'text-blue-500',
    });
  });

  // Sort by timestamp, most recent first
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const recentActivities = activities.slice(0, 50);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activities.length}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Bell className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{posts?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </CardTitle>
          <CardDescription>Timeline of system events and admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                
                return (
                  <div key={activity.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full bg-muted ${activity.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {index < recentActivities.length - 1 && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{activity.action}</span>
                        <Badge variant="secondary" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.timestamp), 'PPp')}
                      </p>
                    </div>
                  </div>
                );
              })}

              {activities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No activity recorded yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
