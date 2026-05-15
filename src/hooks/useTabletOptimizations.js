import React, { useEffect, useMemo } from 'react';
import {
  isTablet,
  isLandscape,
  isSamsungGalaxy,
  isDeXMode,
  getTabletOptimizations,
  applyTabletOptimizations,
  throttle,
  reduceMotion,
} from '@/lib/tablet-optimize';

export const useTabletOptimizations = () => {
  const optimizations = useMemo(() => {
    return {
      isTablet: isTablet(),
      isLandscape: isLandscape(),
      isSamsung: isSamsungGalaxy(),
      isDeX: isDeXMode(),
      reduceMotion: reduceMotion(),
      ...getTabletOptimizations(),
    };
  }, []);

  useEffect(() => {
    applyTabletOptimizations();
  }, []);

  // Monitor orientation changes
  useEffect(() => {
    const handleOrientationChange = throttle(() => {
      window.dispatchEvent(new Event('tablet-orientation-change'));
    }, 500);

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return optimizations;
};

// Hook para disable animations based on performance
export const useOptimizedAnimation = (shouldAnimate = true) => {
  const { disableAnimations, reduceMotion } = useTabletOptimizations();

  return shouldAnimate && !disableAnimations && !reduceMotion;
};

// Hook para memory-safe queries
export const useTabletQuery = (options = {}) => {
  const { reduceMemory } = useTabletOptimizations();

  return {
    ...options,
    staleTime: reduceMemory ? 60000 : options.staleTime || 5 * 60 * 1000,
    cacheTime: reduceMemory ? 30000 : options.cacheTime || 10 * 60 * 1000,
    refetchOnWindowFocus: !reduceMemory,
  };
};