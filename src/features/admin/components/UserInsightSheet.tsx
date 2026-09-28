import { format } from 'date-fns';
import { X, User, FileText, Ban, Shield, Eye } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useUserInsight } from '@/hooks/useAdminActions';

interface UserInsightSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

export function UserInsightSheet({ open, onOpenChange, userId }: UserInsightSheetProps) {
  const { data: insight, isLoading } = useUserInsight(open ? userId : null);
  const profile = insight?.profile as Record<string, unknown> | null;
  const posts = (insight?.posts || []) as Array<Record<string, unknown>>;
  const blocks = (insight?.blocks || []) as Array<Record<string, unknown>>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            User Insight
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : profile ? (
          <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
            <div className="space-y-4">
              {/* Profile Overview */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={(profile.avatar_url as string) || undefined} />
                  <AvatarFallback>{(profile.name as string)?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{profile.name as string}</p>
                  {profile.username && <p className="text-sm text-muted-foreground">@{profile.username as string}</p>}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{profile.role as string}</Badge>
                    {profile.faculty && <Badge variant="secondary" className="text-xs">{profile.faculty as string}</Badge>}
                    {profile.semester && <Badge variant="secondary" className="text-xs">Sem {profile.semester as number}</Badge>}
                  </div>
                </div>
              </div>

              {/* Status Flags */}
              <div className="flex gap-2 flex-wrap">
                {profile.is_shadow_banned && (
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Shadow Banned</Badge>
                )}
                {profile.is_soft_deleted && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20">Soft Deleted</Badge>
                )}
              </div>

              {/* Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {profile.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{profile.email as string}</span></div>}
                  {profile.class_id && <div className="flex justify-between"><span className="text-muted-foreground">Class ID</span><span>{profile.class_id as string}</span></div>}
                  {profile.reg_number && <div className="flex justify-between"><span className="text-muted-foreground">Reg #</span><span>{profile.reg_number as string}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Visits</span><span>{profile.total_visits as number}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Streak</span><span>{profile.visit_streak as number} days</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{format(new Date(profile.created_at as string), 'PP')}</span></div>
                </CardContent>
              </Card>

              {/* Posts */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Recent Posts ({posts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {posts.slice(0, 5).map((post) => (
                      <div key={post.id as string} className="p-2 rounded-lg bg-muted/30 text-sm">
                        <p className="line-clamp-2">{post.content as string}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(post.created_at as string), 'PPp')}
                        </p>
                      </div>
                    ))}
                    {posts.length === 0 && <p className="text-sm text-muted-foreground">No posts</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Block History */}
              {blocks.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Ban className="w-4 h-4" />
                      Block History ({blocks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {blocks.map((block, i) => (
                        <div key={i} className="p-2 rounded-lg bg-destructive/5 text-sm">
                          <p>{block.reason as string || 'No reason provided'}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(block.blocked_at as string), 'PPp')}
                            </span>
                            {block.is_active && <Badge variant="destructive" className="text-xs">Active</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>No user data found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
