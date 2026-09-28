import { useState } from 'react';
import { useMarketplaceListings, useMyListings, useCreateListing, useDeleteListing, useUpdateListingStatus } from '@/hooks/useMarketplace';
import { useUnreadMessageCount } from '@/hooks/useDirectMessages';
import { useAuth } from '@/features/auth/AuthProvider';
import { motion } from 'framer-motion';
import { Search, X, Plus, ShoppingBag, Tag, Trash2, Eye, EyeOff, Loader2, MessageCircle, Inbox } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { MessageSheet } from './components/MessageSheet';
import { InboxList } from './components/InboxSheet';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'books', label: '📚 Books' },
  { value: 'electronics', label: '💻 Electronics' },
  { value: 'supplies', label: '✏️ Supplies' },
  { value: 'clothing', label: '👕 Clothing' },
  { value: 'other', label: '📦 Other' },
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'used', label: 'Used' },
  { value: 'well_used', label: 'Well Used' },
];

const conditionColor: Record<string, string> = {
  new: 'bg-green-500/10 text-green-600',
  like_new: 'bg-blue-500/10 text-blue-600',
  used: 'bg-amber-500/10 text-amber-600',
  well_used: 'bg-red-500/10 text-red-600',
};

function ListingCard({ listing, isOwner, onDelete, onToggleStatus, onMessage }: { listing: any; isOwner?: boolean; onDelete?: () => void; onToggleStatus?: () => void; onMessage?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card p-4 space-y-2"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-foreground text-sm line-clamp-1">{listing.title}</h3>
        <span className="text-primary font-bold text-sm whitespace-nowrap ml-2">
          {listing.price > 0 ? `৳${listing.price}` : 'Free'}
        </span>
      </div>
      
      {/* Seller Identity */}
      {listing.seller_name && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground">{listing.seller_name}</span>
          {listing.seller_username && <span className="text-xs text-muted-foreground">@{listing.seller_username}</span>}
          {listing.seller_faculty && (
            <Badge variant="outline" className="text-[10px] py-0">{listing.seller_faculty}</Badge>
          )}
          {listing.seller_semester && (
            <span className="text-[10px] text-muted-foreground">Sem {listing.seller_semester}</span>
          )}
        </div>
      )}
      
      {listing.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-[10px]">{listing.category}</Badge>
        <Badge className={cn('text-[10px] border-0', conditionColor[listing.condition] || 'bg-muted text-muted-foreground')}>
          {listing.condition.replace('_', ' ')}
        </Badge>
        {listing.status !== 'active' && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">{listing.status}</Badge>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        {!isOwner && onMessage && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onMessage}>
            <MessageCircle className="w-3 h-3 mr-1" /> Message
          </Button>
        )}
        {isOwner && (
          <>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onToggleStatus}>
              {listing.status === 'active' ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {listing.status === 'active' ? 'Hide' : 'Show'}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function CreateListingSheet() {
  const createListing = useCreateListing();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'other', condition: 'used' });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    createListing.mutate(
      { title: form.title, description: form.description || undefined, price: parseFloat(form.price) || 0, category: form.category, condition: form.condition },
      { onSuccess: () => { setOpen(false); setForm({ title: '', description: '', price: '', category: 'other', condition: 'used' }); } }
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Sell</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Create Listing</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Calculus Textbook" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details about the item..." rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price (৳)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0 = Free" /></div>
            <div><Label>Condition</Label>
              <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.filter(c => c.value !== 'all').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={!form.title.trim() || createListing.isPending} className="w-full">
            {createListing.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Post Listing
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MarketplacePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { data: listings, isLoading } = useMarketplaceListings(category);
  const { data: myListings } = useMyListings();
  const deleteListing = useDeleteListing();
  const updateStatus = useUpdateListingStatus();
  const { data: unreadCount } = useUnreadMessageCount();
  
  // Message sheet state
  const [messageTarget, setMessageTarget] = useState<{ userId: string; name: string; listingId: string } | null>(null);

  const filtered = listings?.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.description?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        </div>
        <CreateListingSheet />
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="browse" className="flex-1">Browse</TabsTrigger>
          <TabsTrigger value="mine" className="flex-1">My Listings</TabsTrigger>
          <TabsTrigger value="inbox" className="flex-1 relative">
            <Inbox className="w-4 h-4 mr-1" /> Inbox
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-8" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${category === cat.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
              >{cat.label}</button>
            ))}
          </div>
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
            <div className="space-y-3">
              {filtered.map(l => (
                <ListingCard key={l.id} listing={l}
                  onMessage={l.user_id !== user?.id ? () => setMessageTarget({ userId: l.user_id, name: l.seller_name || 'Seller', listingId: l.id }) : undefined}
                />
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No listings found</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine">
          <div className="space-y-3">
            {myListings?.map(l => (
              <ListingCard key={l.id} listing={l} isOwner
                onDelete={() => deleteListing.mutate(l.id)}
                onToggleStatus={() => updateStatus.mutate({ id: l.id, status: l.status === 'active' ? 'hidden' : 'active' })}
              />
            ))}
            {(!myListings || myListings.length === 0) && (
              <div className="text-center py-12 space-y-2">
                <Tag className="w-10 h-10 mx-auto text-muted-foreground/60" />
                <p className="text-muted-foreground">No listings yet</p>
                <p className="text-xs text-muted-foreground/80">Tap "Sell" to create your first listing</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inbox">
          <InboxList contextType="marketplace" />
        </TabsContent>
      </Tabs>

      {/* Message Sheet */}
      {messageTarget && (
        <MessageSheet
          open={!!messageTarget}
          onOpenChange={open => !open && setMessageTarget(null)}
          otherUserId={messageTarget.userId}
          otherUserName={messageTarget.name}
          contextType="marketplace"
          contextId={messageTarget.listingId}
        />
      )}
    </div>
  );
}

export default MarketplacePage;
