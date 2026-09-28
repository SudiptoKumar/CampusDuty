import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 pb-24 relative overflow-hidden">
      {/* Animated gradient shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 animate-pulse" />
      <div className="absolute inset-0 bg-background/80 z-[1]" />
      <div className="relative z-[2] space-y-5">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 shimmer" />
        <Skeleton className="h-4 w-32 shimmer" />
      </div>

      {/* Quick nav tabs skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-xl shimmer" />
        ))}
      </div>

      {/* Weekly report skeleton */}
      <Skeleton className="h-48 w-full rounded-2xl shimmer" />

      {/* Class cards skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl shimmer" />
        <Skeleton className="h-24 w-full rounded-2xl shimmer" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl shimmer" />
        ))}
      </div>

      {/* Additional widgets skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 rounded-2xl shimmer" />
        <Skeleton className="h-40 rounded-2xl shimmer" />
      </div>
      </div>{/* end z-2 wrapper */}
    </div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`surface-card p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg shimmer" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 shimmer" />
          <Skeleton className="h-3 w-1/2 shimmer" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-lg shimmer" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-muted/30">
      <Skeleton className="w-9 h-9 rounded-lg mb-2 shimmer" />
      <Skeleton className="h-5 w-8 mb-1 shimmer" />
      <Skeleton className="h-2 w-12 shimmer" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl">
      <Skeleton className="h-9 w-9 rounded-lg shimmer" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 shimmer" />
        <Skeleton className="h-3 w-1/2 shimmer" />
      </div>
    </div>
  );
}
