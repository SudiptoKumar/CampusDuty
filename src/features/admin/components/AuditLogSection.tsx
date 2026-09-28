import { useState } from 'react';
import { format } from 'date-fns';
import { 
  ScrollText, Clock, Shield, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminAuditLogs } from '@/hooks/useAdminActions';

const ACTION_COLORS: Record<string, string> = {
  BLOCK_USER: 'bg-destructive/10 text-destructive',
  UNBLOCK_USER: 'bg-green-500/10 text-green-500',
  SOFT_DELETE_USER: 'bg-amber-500/10 text-amber-500',
  HARD_DELETE_USER: 'bg-destructive/10 text-destructive',
  PROMOTE_ADMIN: 'bg-primary/10 text-primary',
  DEMOTE_ADMIN: 'bg-amber-500/10 text-amber-500',
  PROMOTE_CR: 'bg-primary/10 text-primary',
  SHADOW_BAN_USER: 'bg-amber-500/10 text-amber-500',
  UNSHADOW_BAN_USER: 'bg-green-500/10 text-green-500',
  UPDATE_PROFILE: 'bg-muted text-muted-foreground',
  ENABLE_MAINTENANCE: 'bg-destructive/10 text-destructive',
  DISABLE_MAINTENANCE: 'bg-green-500/10 text-green-500',
};

export function AuditLogSection() {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('all');
  const pageSize = 50;
  const { data: logs, isLoading } = useAdminAuditLogs(pageSize, page * pageSize);

  const filteredLogs = actionFilter === 'all' 
    ? logs 
    : logs?.filter(l => l.action === actionFilter);

  const uniqueActions = [...new Set(logs?.map(l => l.action) || [])];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ScrollText className="w-4 h-4" />
                Audit Logs
              </CardTitle>
              <CardDescription>Immutable record of all admin actions</CardDescription>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredLogs?.map((log) => (
                <div key={log.id} className="flex gap-4 p-3 rounded-lg border bg-card">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`p-2 rounded-full ${ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground'}`}>
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{log.admin_name}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                      {log.target_type && (
                        <Badge variant="secondary" className="text-xs">{log.target_type}</Badge>
                      )}
                    </div>
                    {log.reason && (
                      <p className="text-sm text-muted-foreground mt-1">{log.reason}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
              ))}

              {(!filteredLogs || filteredLogs.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No audit logs found</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!logs || logs.length < pageSize}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
