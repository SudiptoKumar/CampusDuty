import { 
  Users, 
  FileText, 
  Bell, 
  TrendingUp,
  BarChart3,
  Activity,
  GraduationCap,
  Building2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAllAppNotifications } from '@/hooks/useAppNotifications';
import { useClassroomPosts } from '@/hooks/useClassroomPosts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Constants } from '@/integrations/supabase/types';

// Faculty types from database
const FACULTIES = Constants.public.Enums.faculty_type;
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

interface FacultySemesterStats {
  faculty: string | null;
  semester: number | null;
  user_count: number;
  role: string;
}

function useAdminUserStats() {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_user_stats');
      if (error) throw error;
      return data as FacultySemesterStats[];
    },
    staleTime: 60 * 1000,
  });
}

export function AnalyticsSection() {
  const { data: users } = useAdminUsers();
  const { data: notifications } = useAllAppNotifications();
  const { data: posts } = useClassroomPosts();
  const { data: facultyStats, isLoading: statsLoading } = useAdminUserStats();

  const totalUsers = users?.length || 0;
  const admins = users?.filter(u => u.role === 'admin').length || 0;
  const crs = users?.filter(u => u.role === 'cr').length || 0;
  const students = users?.filter(u => u.role === 'student').length || 0;

  const crPercentage = totalUsers > 0 ? (crs / totalUsers) * 100 : 0;
  const adminPercentage = totalUsers > 0 ? (admins / totalUsers) * 100 : 0;

  const totalPosts = posts?.length || 0;
  const pinnedPosts = posts?.filter(p => p.is_pinned).length || 0;

  const totalNotifications = notifications?.length || 0;

  // Calculate faculty-wise distribution
  const facultyDistribution = FACULTIES.map(faculty => {
    const count = facultyStats?.filter(s => s.faculty === faculty).reduce((sum, s) => sum + s.user_count, 0) || 0;
    return { faculty, count };
  }).filter(f => f.count > 0).sort((a, b) => b.count - a.count);

  // Calculate semester-wise distribution
  const semesterDistribution = SEMESTERS.map(semester => {
    const count = facultyStats?.filter(s => s.semester === semester).reduce((sum, s) => sum + s.user_count, 0) || 0;
    return { semester, count };
  }).filter(s => s.count > 0);

  const maxFacultyCount = Math.max(...facultyDistribution.map(f => f.count), 1);
  const maxSemesterCount = Math.max(...semesterDistribution.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-4 h-4 text-primary" />
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
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{crs}</p>
                <p className="text-xs text-muted-foreground">Active CRs</p>
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
                <p className="text-2xl font-bold">{totalPosts}</p>
                <p className="text-xs text-muted-foreground">Total Posts</p>
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
                <p className="text-2xl font-bold">{totalNotifications}</p>
                <p className="text-xs text-muted-foreground">Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faculty-wise Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Faculty-wise Distribution
          </CardTitle>
          <CardDescription>User count by faculty</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {statsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : facultyDistribution.length > 0 ? (
            facultyDistribution.map(({ faculty, count }) => (
              <div key={faculty} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{faculty}</span>
                  <span className="text-muted-foreground">{count} users</span>
                </div>
                <Progress 
                  value={(count / maxFacultyCount) * 100} 
                  className="h-2" 
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No faculty data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Semester-wise Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Semester-wise Distribution
          </CardTitle>
          <CardDescription>User count by semester</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : semesterDistribution.length > 0 ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {semesterDistribution.map(({ semester, count }) => (
                <div 
                  key={semester}
                  className="flex flex-col items-center p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="text-lg font-bold">{count}</span>
                  <span className="text-xs text-muted-foreground">Sem {semester}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No semester data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* User Distribution by Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            User Distribution by Role
          </CardTitle>
          <CardDescription>Breakdown of user roles in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Students</span>
              <span className="text-muted-foreground">{students} ({((students / totalUsers) * 100 || 0).toFixed(1)}%)</span>
            </div>
            <Progress value={(students / totalUsers) * 100 || 0} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Class Representatives</span>
              <span className="text-muted-foreground">{crs} ({crPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={crPercentage} className="h-2 [&>div]:bg-primary" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Administrators</span>
              <span className="text-muted-foreground">{admins} ({adminPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={adminPercentage} className="h-2 [&>div]:bg-red-500" />
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Content Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Total Posts</span>
                <span className="font-semibold">{totalPosts}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Pinned Posts</span>
                <span className="font-semibold">{pinnedPosts}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Regular Posts</span>
                <span className="font-semibold">{totalPosts - pinnedPosts}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notification Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Total Sent</span>
                <span className="font-semibold">{totalNotifications}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Features</span>
                <span className="font-semibold">{notifications?.filter(n => n.type === 'feature').length || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Announcements</span>
                <span className="font-semibold">{notifications?.filter(n => n.type === 'announcement').length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
