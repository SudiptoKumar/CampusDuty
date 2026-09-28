import { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  const controls = useAnimation();
  
  // Transform pull distance to visual elements
  const indicatorY = useTransform(pullDistance, [0, MAX_PULL], [-40, 20]);
  const indicatorOpacity = useTransform(pullDistance, [0, PULL_THRESHOLD * 0.5, PULL_THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(pullDistance, [0, PULL_THRESHOLD], [0.5, 1]);
  const indicatorRotate = useTransform(pullDistance, [0, MAX_PULL], [0, 360]);
  
  // Find scrollable parent
  const getScrollParent = useCallback((): HTMLElement | null => {
    let element = containerRef.current?.parentElement;
    while (element) {
      const { overflow, overflowY } = window.getComputedStyle(element);
      if (overflow === 'auto' || overflow === 'scroll' || overflowY === 'auto' || overflowY === 'scroll') {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }, []);
  
  const isAtTop = useCallback(() => {
    const scrollParent = getScrollParent();
    if (scrollParent) {
      return scrollParent.scrollTop <= 0;
    }
    return window.scrollY <= 0;
  }, [getScrollParent]);
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    if (isAtTop()) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing, isAtTop]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && isAtTop()) {
      // Apply resistance to pull
      const resistance = 0.5;
      const pull = Math.min(diff * resistance, MAX_PULL);
      pullDistance.set(pull);
    } else if (diff <= 0) {
      // Reset if scrolling up
      pullDistance.set(0);
      setIsPulling(false);
    }
  }, [isPulling, isRefreshing, isAtTop, pullDistance]);
  
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);
    
    const currentPull = pullDistance.get();
    
    if (currentPull >= PULL_THRESHOLD && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      }
      
      setIsRefreshing(false);
    }
    
    // Spring back to original position
    pullDistance.set(0);
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  // Attach touch listeners to the scroll parent or window
  useEffect(() => {
    const scrollParent = getScrollParent() || window;
    const target = scrollParent === window ? document : scrollParent;
    
    target.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    target.addEventListener('touchmove', handleTouchMove as EventListener, { passive: true });
    target.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
    
    return () => {
      target.removeEventListener('touchstart', handleTouchStart as EventListener);
      target.removeEventListener('touchmove', handleTouchMove as EventListener);
      target.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [getScrollParent, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      {/* Pull indicator */}
      <motion.div 
        className="fixed left-0 right-0 top-14 flex justify-center z-50 pointer-events-none"
        style={{ y: indicatorY, opacity: indicatorOpacity }}
      >
        <motion.div 
          className="w-10 h-10 rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center shadow-lg border border-border"
          style={{ scale: indicatorScale }}
        >
          <AnimatePresence mode="wait">
            {isRefreshing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { repeat: Infinity, duration: 1, ease: 'linear' } }}
              >
                <Loader2 className="w-5 h-5 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="pull"
                style={{ rotate: indicatorRotate }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RefreshCw className="w-5 h-5 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      
      {/* Content - no transform, just render children directly */}
      {children}
    </div>
  );
}
