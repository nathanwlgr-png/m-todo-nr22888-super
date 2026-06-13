import { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * PullToRefresh — wraps any scrollable content with a native-style pull gesture.
 * Usage: <PullToRefresh onRefresh={refetchFn}>{children}</PullToRefresh>
 */
export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const THRESHOLD = 64;

  const onTouchStart = useCallback((e) => {
    // Only activate at the top of the scroll container
    const el = e.currentTarget;
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) { setPullDistance(0); return; }
    // Rubber-band resistance
    setPullDistance(Math.min(delta * 0.45, THRESHOLD + 20));
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try { await onRefresh(); } catch (_) {}
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 8 || refreshing;

  return (
    <div
      className={`relative overflow-y-auto ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull indicator */}
      {showIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex justify-center items-center z-20 pointer-events-none transition-all"
          style={{ height: refreshing ? THRESHOLD : pullDistance, overflow: 'hidden' }}
        >
          <div
            className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg"
            style={{
              transform: `scale(${0.5 + progress * 0.5}) rotate(${refreshing ? 0 : progress * 180}deg)`,
              opacity: progress,
              transition: refreshing ? 'transform 0.2s' : 'none',
            }}
          >
            <Loader2 className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
          </div>
        </div>
      )}
      <div style={{ transform: `translateY(${refreshing ? THRESHOLD : pullDistance}px)`, transition: refreshing || pullDistance === 0 ? 'transform 0.25s ease' : 'none' }}>
        {children}
      </div>
    </div>
  );
}