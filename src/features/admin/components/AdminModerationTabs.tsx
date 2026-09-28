import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Trash2, ShoppingBag, Calendar, Search, Gamepad2 } from 'lucide-react';
import { useMarketplaceListings, useUpdateListingStatus, useDeleteListing } from '@/hooks/useMarketplace';
import { useCampusEvents, useDeleteEvent } from '@/hooks/useEvents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function MarketplaceModSection() {
  const { data: listings = [], isLoading } = useMarketplaceListings();
  const updateStatus = useUpdateListingStatus();
  const deleteListing = useDeleteListing();
  const [search, setSearch] = useState('');

  const filtered = listings.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    (l.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filtered.map(listing => (
          <div key={listing.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <ShoppingBag className="w-8 h-8 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{listing.title}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{listing.category}</Badge>
                <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className="text-xs">{listing.status}</Badge>
                <span className="text-xs text-muted-foreground">৳{listing.price}</span>
              </div>
            </div>
            <div className="flex gap-1">
              {listing.status === 'active' && (
                <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: listing.id, status: 'removed' }, { onSuccess: () => toast.success('Listing hidden') })}>
                  Hide
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently remove this listing.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteListing.mutate(listing.id, { onSuccess: () => toast.success('Deleted') })}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No listings found</p>}
      </div>
    </div>
  );
}

export function EventsModSection() {
  const { data: events = [], isLoading } = useCampusEvents();
  const deleteEvent = useDeleteEvent();

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {events.map(event => (
        <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Calendar className="w-8 h-8 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(event.event_date), 'PPP')} · {event.event_type}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently remove this event.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteEvent.mutate(event.id, { onSuccess: () => toast.success('Deleted') })}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
      {events.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No events</p>}
    </div>
  );
}

export function AdminModerationTabs() {
  return (
    <Tabs defaultValue="marketplace" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
      </TabsList>
      <TabsContent value="marketplace" className="mt-4">
        <MarketplaceModSection />
      </TabsContent>
      <TabsContent value="events" className="mt-4">
        <EventsModSection />
      </TabsContent>
    </Tabs>
  );
}
