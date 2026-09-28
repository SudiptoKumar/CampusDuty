import { 
  Users, Shield, Ban, FileText, Activity, AlertTriangle, Crown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAdminAuditLogs, useMaintenanceMode } from '@/hooks/useAdminActions';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';
import { useClassroomPosts } from '@/hooks/useClassroomPosts';
import { format } from 'date-fns';

export function DashboardSection() {
  const { data: users } = useAdminUsers();
  const { data: auditLogs } = useAdminAuditLogs(10, 0);
  const { data: posts } = useClassroomPosts();
  const { data: maintenanceMode } = useMaintenanceMode();

  const totalUsers = users?.length || 0;
  const blockedUsers = users?.filter(u => u.is_blocked).length || 0;
  const shadowBanned = users?.filter(u => u.is_shadow_banned).length || 0;
  const totalPosts = posts?.length || 0;

  return (
    <div className="space-y-6">
      {/* Liquid hero banner */}
      <div className="h-24 rounded-2xl overflow-hidden relative">
        <LiquidEffectAnimation metalness={0.85} roughness={0.2} displacementScale={4} />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent z-[1] flex items-center px-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Admin Dashboard</h2>
            <p className="text-xs text-muted-foreground">System overview & management</p>
          </div>
        </div>
      </div>

      {/* Maintenance Warning */}
      {maintenanceMode && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-medium text-amber-500">Maintenance Mode Active</p>
            <p className="text-sm text-muted-foreground">Non-admin users are being redirected.</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <Ban className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blockedUsers}</p>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shadowBanned}</p>
                <p className="text-xs text-muted-foreground">Shadow Banned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPosts}</p>
                <p className="text-xs text-muted-foreground">Posts Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Admin Actions
          </CardTitle>
          <CardDescription>Last 10 admin operations</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {auditLogs?.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="p-1.5 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                    <Crown className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{log.admin_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {log.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.reason}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
              ))}
              {(!auditLogs || auditLogs.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No admin actions recorded yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
