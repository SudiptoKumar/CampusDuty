import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, FileText, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { ClassroomPost } from '@/hooks/useClassroomPosts';
import { MarkdownContent } from './MarkdownContent';
import { formatDistanceToNow } from 'date-fns';
import { UserProfileSheet } from './UserProfileSheet';

interface SearchViewProps {
  posts: ClassroomPost[];
  onTagClick: (tag: string) => void;
}

interface PersonResult {
  user_id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  role: string;
}

export function SearchView({ posts, onTagClick }: SearchViewProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'people'>('posts');
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  // All unique tags from posts
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [posts]);

  // Filter posts by query
  const filteredPosts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return posts.filter(p =>
      p.content.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
      p.author?.name?.toLowerCase().includes(q)
    );
  }, [posts, query]);

  // Search people - query all profiles in same faculty/semester, not just post authors
  const searchPeople = async (q: string) => {
    if (!q.trim()) { setPeople([]); return; }
    setPeopleLoading(true);
    try {
      // First get user's own profile to know faculty/semester
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPeople([]); return; }

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('faculty, semester')
        .eq('user_id', user.id)
        .single();

      if (!myProfile?.faculty || !myProfile?.semester) { setPeople([]); return; }

      // Query all profiles in same faculty+semester
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('faculty', myProfile.faculty)
        .eq('semester', myProfile.semester)
        .limit(50);

      if (!allProfiles?.length) { setPeople([]); return; }

      const userIds = allProfiles.map(p => p.user_id);
      const { data } = await supabase.rpc('get_public_profiles', { _user_ids: userIds });
      if (data) {
        const lq = q.toLowerCase();
        setPeople(
          (data as PersonResult[]).filter(p =>
            p.name?.toLowerCase().includes(lq) ||
            p.username?.toLowerCase().includes(lq)
          )
        );
      }
    } finally { setPeopleLoading(false); }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (activeTab === 'people') searchPeople(val);
  };

  const handleTabChange = (tab: 'posts' | 'people') => {
    setActiveTab(tab);
    if (tab === 'people' && query.trim()) searchPeople(query);
  };

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search posts, people, tags..."
            className="pl-9 rounded-full bg-muted border-0 h-10"
          />
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-border">
        <button onClick={() => handleTabChange('posts')}
          className={`flex-1 py-2.5 text-sm font-semibold text-center relative ${activeTab === 'posts' ? 'text-foreground' : 'text-muted-foreground'}`}>
          <FileText className="h-4 w-4 inline mr-1.5" />Posts
          {activeTab === 'posts' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full bg-primary" />}
        </button>
        <button onClick={() => handleTabChange('people')}
          className={`flex-1 py-2.5 text-sm font-semibold text-center relative ${activeTab === 'people' ? 'text-foreground' : 'text-muted-foreground'}`}>
          <Users className="h-4 w-4 inline mr-1.5" />People
          {activeTab === 'people' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full bg-primary" />}
        </button>
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && activeTab === 'posts' && (
        <div className="px-4 py-2.5 border-b border-border overflow-x-auto flex gap-2 no-scrollbar">
          {allTags.map(tag => (
            <button key={tag} onClick={() => onTagClick(tag)}
              className="text-[11px] px-3 py-1 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap hover:bg-primary/20 transition-colors flex items-center gap-1">
              <Hash className="h-3 w-3" />{tag}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {activeTab === 'posts' ? (
        query.trim() ? (
          filteredPosts.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredPosts.map(post => (
                <div key={post.id} className="px-4 py-3 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/classroom/post/${post.id}`)}>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={post.author?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{post.author?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-bold text-sm truncate">{post.author?.name}</span>
                      {post.author?.role === 'cr' && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                      <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}</span>
                    </div>
                    <div className="text-sm line-clamp-3"><MarkdownContent content={post.content} /></div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {post.tags.map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No posts found</div>
          )
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">Type to search posts</div>
        )
      ) : (
        // People tab
        query.trim() ? (
          peopleLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Searching...</div>
          ) : people.length > 0 ? (
            <div className="divide-y divide-border">
              {people.map(person => (
                <button key={person.user_id} onClick={() => setProfileUserId(person.user_id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={person.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{person.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm truncate">{person.name}</span>
                      {person.role === 'cr' && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    {person.username && <span className="text-xs text-muted-foreground">@{person.username}</span>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No people found</div>
          )
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">Type to search people</div>
        )
      )}

      <UserProfileSheet open={!!profileUserId} onOpenChange={open => !open && setProfileUserId(null)} userId={profileUserId} />
    </div>
  );
}
