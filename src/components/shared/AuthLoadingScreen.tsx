import { GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';

/**
 * A fast, content-first loading screen that appears while checking auth.
 * Shows the app shell immediately with skeleton content instead of a blank spinner.
 */
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <LiquidEffectAnimation metalness={0.6} roughness={0.3} displacementScale={3} />
      <div className="absolute inset-0 bg-background/90 z-[1]" />
      {/* Mobile header skeleton */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/50 relative z-[2]">
        <div className="flex items-center gap-2">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)'
            }}
          >
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">Campus Duty</span>
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      
      {/* Content area with skeleton */}
      <div className="p-4 md:p-6 lg:p-8 space-y-5 relative z-[2]">
        {/* Greeting skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        
        {/* Quick nav tabs */}
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-xl shrink-0" />
          ))}
        </div>
        
        {/* Main card */}
        <Skeleton className="h-44 w-full rounded-2xl" />
        
        {/* Two smaller cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
