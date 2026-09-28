import { useState } from 'react';
import { format } from 'date-fns';
import { 
  FileText, Loader2, Trash2, Pin, PinOff, Search, EyeOff, Eye, Shield, BadgeCheck
} from 'lucide-react';
import { useClassroomPosts, useDeletePost, useTogglePinPost } from '@/hooks/useClassroomPosts';
import { useAdminSearchPosts } from '@/hooks/useAdminActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { AdminModerationTabs } from './AdminModerationTabs';

export function ContentModerationSection() {
  const { data: posts, isLoading } = useClassroomPosts();
  const deletePost = useDeletePost();
  const togglePin = useTogglePinPost();
  const [searchKeyword, setSearchKeyword] = useState('');
  const { data: searchResults, isLoading: searching } = useAdminSearchPosts(searchKeyword);

  const displayPosts = searchKeyword.length >= 2 ? searchResults : posts;

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
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-muted"><FileText className="w-4 h-4 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{posts?.length || 0}</p><p className="text-xs text-muted-foreground">Total Posts</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-primary/10"><Pin className="w-4 h-4 text-primary" /></div><div><p className="text-2xl font-bold">{posts?.filter(p => p.is_pinned).length || 0}</p><p className="text-xs text-muted-foreground">Pinned</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-amber-500/10"><EyeOff className="w-4 h-4 text-amber-500" /></div><div><p className="text-2xl font-bold">{searchResults?.filter(p => p.is_shadow_banned).length || 0}</p><p className="text-xs text-muted-foreground">Shadow Banned</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-muted"><Search className="w-4 h-4 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{searchResults?.length || 0}</p><p className="text-xs text-muted-foreground">Search Results</p></div></div></CardContent></Card>
      </div>

      {/* Global Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Content Moderation</CardTitle>
          <CardDescription>Search and manage classroom content globally</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search all posts globally..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {(displayPosts as any[])?.map((post: any) => {
              const authorName = post.author?.name || post.author_name || 'Unknown';
              const authorAvatar = post.author?.avatar_url;
              const authorRole = post.author?.role;
              
              return (
                <div key={post.id} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={authorAvatar || undefined} />
                    <AvatarFallback>{authorName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">{authorName}</span>
                      {post.is_pinned && <Badge variant="secondary" className="text-xs"><Pin className="w-3 h-3 mr-1" />Pinned</Badge>}
                      {post.is_shadow_banned && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs"><EyeOff className="w-3 h-3 mr-1" />Shadow</Badge>}
                      {post.is_verified && <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Verified</Badge>}
                      {post.faculty && <Badge variant="outline" className="text-xs">{post.faculty}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{post.content}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(post.created_at), 'PPp')}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {post.is_pinned !== undefined && (
                      <Button size="icon" variant="ghost" onClick={() => togglePin.mutate({ postId: post.id, isPinned: !post.is_pinned })} disabled={togglePin.isPending}>
                        {post.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove this post.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePost.mutate(post.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
            {(!displayPosts || (displayPosts as any[]).length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{searchKeyword.length >= 2 ? 'No posts found' : 'No posts to moderate'}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Marketplace & Events Moderation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Marketplace & Events</CardTitle>
          <CardDescription>Moderate listings and campus events</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminModerationTabs />
        </CardContent>
      </Card>
    </div>
  );
}
