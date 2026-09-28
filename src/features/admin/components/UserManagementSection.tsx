import { useState } from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Shield, 
  BadgeCheck, 
  User,
  Upload,
  Download,
  Loader2,
  Filter,
  Ban,
  Trash2,
  Eye,
  EyeOff,
  Crown,
  Pencil,
  MoreHorizontal
} from 'lucide-react';
import { useRef } from 'react';
import { useAdminUsers, usePromoteToCR, useDemoteFromCR, useBulkPromoteCRs, useBulkDemoteCRs } from '@/hooks/useAdminUsers';
import { useUnblockUser, useShadowBanUser, usePromoteToAdmin, useDemoteFromAdmin } from '@/hooks/useAdminActions';
import { usePermission } from '@/hooks/usePermission';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { AppRole } from '@/hooks/usePermission';

import { BlockUserDialog } from './BlockUserDialog';
import { DeleteUserDialog } from './DeleteUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { UserInsightSheet } from './UserInsightSheet';

export function UserManagementSection() {
  const { data: users, isLoading } = useAdminUsers();
  const { isSuperAdmin } = usePermission('admin');
  const promoteToCR = usePromoteToCR();
  const demoteFromCR = useDemoteFromCR();
  const bulkPromote = useBulkPromoteCRs();
  const bulkDemote = useBulkDemoteCRs();
  const unblockUser = useUnblockUser();
  const shadowBan = useShadowBanUser();
  const promoteToAdmin = usePromoteToAdmin();
  const demoteFromAdmin = useDemoteFromAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'blocked' | 'shadow_banned' | 'deleted'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialogs state
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; userId: string; name: string }>({ open: false, userId: '', name: '' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; name: string; mode: 'soft' | 'hard' }>({ open: false, userId: '', name: '', mode: 'soft' });
  const [editDialog, setEditDialog] = useState<{ open: boolean; userId: string; name: string; faculty: string | null; semester: number | null }>({ open: false, userId: '', name: '', faculty: null, semester: null });
  const [insightSheet, setInsightSheet] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (user.username?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'blocked' && user.is_blocked) ||
      (statusFilter === 'shadow_banned' && user.is_shadow_banned) ||
      (statusFilter === 'deleted' && user.is_soft_deleted);
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const stats = {
    total: users?.length || 0,
    blocked: users?.filter(u => u.is_blocked).length || 0,
    shadowBanned: users?.filter(u => u.is_shadow_banned).length || 0,
    admins: users?.filter(u => u.role === 'admin' || u.role === 'super_admin').length || 0,
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Crown className="w-3 h-3 mr-1" />Super</Badge>;
      case 'admin':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'cr':
        return <Badge className="bg-primary/10 text-primary border-primary/20"><BadgeCheck className="w-3 h-3 mr-1" />CR</Badge>;
      default:
        return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />Student</Badge>;
    }
  };

  const getStatusBadges = (user: typeof filteredUsers[0]) => (
    <>
      {user.is_blocked && <Badge variant="destructive" className="text-xs">Blocked</Badge>}
      {user.is_shadow_banned && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs">Shadow</Badge>}
      {user.is_soft_deleted && <Badge className="bg-muted text-muted-foreground text-xs">Deleted</Badge>}
    </>
  );

  const exportUserList = () => {
    const csv = 'username,name,role,faculty,semester,blocked,shadow_banned\n' + 
      users?.map(u => `${u.username || ''},${u.name},${u.role},${u.faculty || ''},${u.semester || ''},${u.is_blocked},${u.is_shadow_banned}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'users.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-muted"><User className="w-4 h-4 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Users</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-destructive/10"><Ban className="w-4 h-4 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.blocked}</p><p className="text-xs text-muted-foreground">Blocked</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-amber-500/10"><EyeOff className="w-4 h-4 text-amber-500" /></div><div><p className="text-2xl font-bold">{stats.shadowBanned}</p><p className="text-xs text-muted-foreground">Shadow Banned</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-destructive/10"><Shield className="w-4 h-4 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.admins}</p><p className="text-xs text-muted-foreground">Admins</p></div></div></CardContent></Card>
      </div>

      {/* Search/Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">User Management</CardTitle>
          <CardDescription>Search, filter, and manage users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as AppRole | 'all')}>
              <SelectTrigger className="w-full sm:w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cr">CR</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="shadow_banned">Shadow Banned</SelectItem>
                <SelectItem value="deleted">Soft Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportUserList}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          </div>

          {/* User List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredUsers.map(user => (
              <div key={user.user_id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{user.name}</p>
                    {getStatusBadges(user)}
                  </div>
                  {user.username && <p className="text-xs text-muted-foreground truncate">@{user.username}</p>}
                  {user.faculty && <p className="text-xs text-muted-foreground">{user.faculty} • Sem {user.semester}</p>}
                </div>
                {getRoleBadge(user.role)}
                
                {/* Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost"><MoreHorizontal className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setInsightSheet({ open: true, userId: user.user_id })}>
                      <Eye className="w-4 h-4 mr-2" />View Insight
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditDialog({ open: true, userId: user.user_id, name: user.name, faculty: user.faculty, semester: user.semester })}>
                      <Pencil className="w-4 h-4 mr-2" />Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    
                    {/* Role management */}
                    {user.role === 'student' && (
                      <DropdownMenuItem onClick={() => promoteToCR.mutate(user.user_id)}>
                        <UserCheck className="w-4 h-4 mr-2" />Promote to CR
                      </DropdownMenuItem>
                    )}
                    {user.role === 'cr' && (
                      <DropdownMenuItem onClick={() => demoteFromCR.mutate(user.user_id)}>
                        <UserX className="w-4 h-4 mr-2" />Remove CR
                      </DropdownMenuItem>
                    )}
                    {isSuperAdmin && user.role !== 'super_admin' && user.role !== 'admin' && (
                      <DropdownMenuItem onClick={() => promoteToAdmin.mutate(user.user_id)}>
                        <Shield className="w-4 h-4 mr-2" />Promote to Admin
                      </DropdownMenuItem>
                    )}
                    {isSuperAdmin && user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => demoteFromAdmin.mutate(user.user_id)}>
                        <Shield className="w-4 h-4 mr-2" />Remove Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    
                    {/* Moderation */}
                    {!user.is_shadow_banned ? (
                      <DropdownMenuItem onClick={() => shadowBan.mutate({ userId: user.user_id, ban: true })}>
                        <EyeOff className="w-4 h-4 mr-2" />Shadow Ban
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => shadowBan.mutate({ userId: user.user_id, ban: false })}>
                        <Eye className="w-4 h-4 mr-2" />Remove Shadow Ban
                      </DropdownMenuItem>
                    )}
                    {!user.is_blocked ? (
                      <DropdownMenuItem onClick={() => setBlockDialog({ open: true, userId: user.user_id, name: user.name })} className="text-destructive">
                        <Ban className="w-4 h-4 mr-2" />Block User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => unblockUser.mutate(user.user_id)}>
                        <Ban className="w-4 h-4 mr-2" />Unblock
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, userId: user.user_id, name: user.name, mode: 'soft' })} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />Soft Delete
                    </DropdownMenuItem>
                    {isSuperAdmin && (
                      <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, userId: user.user_id, name: user.name, mode: 'hard' })} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />Hard Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BlockUserDialog open={blockDialog.open} onOpenChange={(o) => setBlockDialog(p => ({ ...p, open: o }))} userId={blockDialog.userId} userName={blockDialog.name} />
      <DeleteUserDialog open={deleteDialog.open} onOpenChange={(o) => setDeleteDialog(p => ({ ...p, open: o }))} userId={deleteDialog.userId} userName={deleteDialog.name} mode={deleteDialog.mode} />
      <EditUserDialog open={editDialog.open} onOpenChange={(o) => setEditDialog(p => ({ ...p, open: o }))} userId={editDialog.userId} userName={editDialog.name} currentFaculty={editDialog.faculty} currentSemester={editDialog.semester} />
      <UserInsightSheet open={insightSheet.open} onOpenChange={(o) => setInsightSheet(p => ({ ...p, open: o }))} userId={insightSheet.userId} />
    </div>
  );
}
