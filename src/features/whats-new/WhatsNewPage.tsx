import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bell, Megaphone, Wrench, Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllAppNotifications } from '@/hooks/useAppNotifications';

const typeConfig: Record<string, { icon: typeof Sparkles; color: string; bgColor: string }> = {
  feature: { icon: Sparkles, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  update: { icon: Zap, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  announcement: { icon: Megaphone, color: 'text-primary', bgColor: 'bg-primary/10' },
  maintenance: { icon: Wrench, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
};

export function WhatsNewPage() {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useAllAppNotifications();
  
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">What's New</h1>
            <p className="text-muted-foreground text-sm">
              Changelog and updates history
            </p>
          </div>
        </div>
      </motion.div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : notifications?.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No updates yet</h3>
          <p className="text-muted-foreground text-sm">
            Check back later for new features and announcements
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications?.map((notification, index) => {
            const config = typeConfig[notification.type] || typeConfig.announcement;
            const Icon = config.icon;
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
                  onClick={() => navigate(`/notifications/${notification.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className={`shrink-0 w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{notification.title}</h3>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {notification.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'MMMM d, yyyy • h:mm a')}
                          </p>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WhatsNewPage;
