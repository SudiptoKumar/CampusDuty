import { 
  Settings2, Database, Shield, Bell, Users, Info, Crown, Wrench, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePermission } from '@/hooks/usePermission';
import { useMaintenanceMode, useToggleMaintenanceMode } from '@/hooks/useAdminActions';

export function SystemSettingsSection() {
  const { isSuperAdmin } = usePermission('admin');
  const { data: maintenanceMode, isLoading: loadingMaintenance } = useMaintenanceMode();
  const toggleMaintenance = useToggleMaintenanceMode();

  return (
    <div className="space-y-6">
      {/* Maintenance Mode */}
      {isSuperAdmin && (
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-500" />
              Maintenance Mode
            </CardTitle>
            <CardDescription>Redirect all non-admin users to a maintenance page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                {maintenanceMode && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                <div>
                  <Label className="font-medium">
                    {maintenanceMode ? 'Maintenance Mode is ON' : 'Maintenance Mode is OFF'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {maintenanceMode ? 'Non-admin users are being redirected' : 'Platform is operating normally'}
                  </p>
                </div>
              </div>
              <Switch
                checked={maintenanceMode || false}
                onCheckedChange={(checked) => toggleMaintenance.mutate(checked)}
                disabled={toggleMaintenance.isPending || loadingMaintenance}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            System Information
          </CardTitle>
          <CardDescription>Current system configuration and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2"><Database className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Database</span></div>
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Authentication</span></div>
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Notifications</span></div>
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2"><Crown className="w-4 h-4 text-amber-500" /><span className="font-medium">Super Administrator</span></div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Full platform control & all admin abilities</li>
              <li>• Toggle maintenance mode</li>
              <li>• Promote/demote admins</li>
              <li>• Hard delete users permanently</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-destructive" /><span className="font-medium">Administrator</span></div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Manage users and CR roles</li>
              <li>• Block/unblock users</li>
              <li>• Shadow ban users</li>
              <li>• Moderate content</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
