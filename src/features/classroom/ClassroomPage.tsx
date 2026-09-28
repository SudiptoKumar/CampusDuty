import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, GraduationCap, BookOpen, Settings, Home, Search, Mail, Hash } from 'lucide-react';
import { useClassroomPosts } from '@/hooks/useClassroomPosts';
import { usePermission } from '@/hooks/usePermission';
import { useProfile } from '@/hooks/useProfile';
import { useMarkClassroomVisited } from '@/hooks/useUnreadClassroomPosts';
import { PostCard } from './components/PostCard';
import { CreatePostForm } from './components/CreatePostForm';
import { ScheduledPostsTab } from './components/ScheduledPostsTab';
import { SearchView } from './components/SearchView';
import { InboxList } from '@/features/marketplace/components/InboxSheet';
import { EmptyState } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { GPAForecasterTile } from '@/features/dashboard/components/bento/GPAForecasterTile';
import { UpcomingDeadlinesWidget } from '@/features/dashboard/components/UpcomingDeadlinesWidget';

type Tab = 'home' | 'search' | 'inbox';

export function ClassroomPage() {
  const { data: posts, isLoading } = useClassroomPosts();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { isCR, isAdmin } = usePermission('student');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showScheduled, setShowScheduled] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const markVisited = useMarkClassroomVisited();
  
  useEffect(() => { markVisited(); }, []);

  const hasClassroomAccess = profile?.faculty && profile?.semester;
  const canSchedule = isCR || isAdmin;

  const filteredPosts = tagFilter
    ? posts?.filter(p => (p.tags || []).includes(tagFilter))
    : posts;

  // Compute trending tags from posts
  const trendingTags = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    const tagCount: Record<string, number> = {};
    posts.forEach(p => (p.tags || []).forEach((t: string) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  if (profileLoading) {
    return (
      <div className="max-w-[600px] mx-auto p-3 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!hasClassroomAccess) {
    return (
      <div className="max-w-[600px] mx-auto p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Setup Required</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Set your Faculty and Semester to access your classroom feed.
                  </p>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <span className="text-sm px-3 py-1.5 rounded-full bg-muted">
                    <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
                    {profile?.faculty || <span className="text-primary">Not set</span>}
                  </span>
                  <span className="text-sm px-3 py-1.5 rounded-full bg-muted">
                    <GraduationCap className="w-3.5 h-3.5 inline mr-1.5" />
                    {profile?.semester ? `Sem ${profile.semester}` : <span className="text-primary">Not set</span>}
                  </span>
                </div>
                <Button asChild className="gap-2 rounded-full px-6">
                  <Link to="/id-card">
                    <Settings className="w-4 h-4" />
                    Go to Campus ID
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_minmax(0,600px)_300px] pb-16">
      {/* Left gutter - empty on desktop, hidden on mobile */}
      <div className="hidden lg:block" />

      {/* Center feed column */}
      <div className="min-w-0">
        {activeTab === 'home' && (
          <>
            {canSchedule && (
              <div className="flex border-b border-border">
                <button
                  onClick={() => setShowScheduled(false)}
                  className={`flex-1 py-3 text-sm font-semibold text-center relative transition-colors ${
                    !showScheduled ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Feed
                  {!showScheduled && (
                    <motion.div layoutId="feed-tab" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-full bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setShowScheduled(true)}
                  className={`flex-1 py-3 text-sm font-semibold text-center relative transition-colors ${
                    showScheduled ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Scheduled
                  {showScheduled && (
                    <motion.div layoutId="feed-tab" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-full bg-primary" />
                  )}
                </button>
              </div>
            )}

            {showScheduled && canSchedule ? (
              <div className="p-4">
                <ScheduledPostsTab />
              </div>
            ) : (
              <>
                <div className="p-3 space-y-4">
                  <CreatePostForm />

                {tagFilter && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Filtering:</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tagFilter}</span>
                    <button onClick={() => setTagFilter(null)} className="text-xs text-muted-foreground hover:text-foreground ml-auto">Clear</button>
                  </div>
                )}

                {isLoading ? (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-xl border border-border bg-card p-4 flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : filteredPosts?.length === 0 ? (
                  <div className="py-16">
                    <EmptyState
                      icon={<Megaphone className="h-12 w-12 text-muted-foreground" />}
                      title="No posts yet"
                      description="Be the first to share something with your class!"
                    />
                  </div>
                ) : (
                  <>
                    {filteredPosts?.map((post) => (
                      <PostCard key={post.id} post={post} onTagClick={setTagFilter} />
                    ))}
                  </>
                )}
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'search' && (
          <SearchView posts={posts || []} onTagClick={(tag) => { setTagFilter(tag); setActiveTab('home'); }} />
        )}

        {activeTab === 'inbox' && (
          <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Messages</h2>
            <InboxList contextType="classroom" />
          </div>
        )}
      </div>

      {/* Right sidebar - desktop only */}
      <div className="hidden lg:block pl-4 pt-3">
        <div className="sticky top-4 space-y-4">
          <GPAForecasterTile />
          <UpcomingDeadlinesWidget />

          {/* Trending Tags */}
          {trendingTags.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-sm">Trending Tags</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => { setTagFilter(tag); setActiveTab('home'); }}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors font-medium"
                  >
                    #{tag} <span className="text-muted-foreground ml-0.5">({count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="max-w-[600px] mx-auto flex items-center justify-around py-2">
          {[
            { id: 'home' as Tab, icon: Home, label: 'Home' },
            { id: 'search' as Tab, icon: Search, label: 'Search' },
            { id: 'inbox' as Tab, icon: Mail, label: 'Inbox' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
                activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClassroomPage;
