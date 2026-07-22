import React, { useEffect, useState } from 'react';
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
  const readOptimizations = () => ({
    isTablet: isTablet(),
    isLandscape: isLandscape(),
    isSamsung: isSamsungGalaxy(),
    isDeX: isDeXMode(),
    reduceMotion: reduceMotion(),
    ...getTabletOptimizations(),
  });
  const [optimizations, setOptimizations] = useState(readOptimizations);

  useEffect(() => {
    applyTabletOptimizations();
  }, []);

  // Atualiza o layout ao girar a tela ou alternar o modo DeX.
  useEffect(() => {
    const handleOrientationChange = throttle(() => {
      setOptimizations(readOptimizations());
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
    staleTime: reduceMemory ? 60000 : (options.staleTime ?? 5 * 60 * 1000),
    gcTime: reduceMemory ? 30000 : (options.gcTime ?? 10 * 60 * 1000),
    refetchOnWindowFocus: !reduceMemory,
  };
};