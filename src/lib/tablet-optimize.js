// Detectar dispositivo tablet
export const isTablet = () => {
  const ua = navigator.userAgent;
  const shortSide = Math.min(window.screen.width, window.screen.height);
  const tabletUA = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua);
  const largeTouchDevice = navigator.maxTouchPoints > 0 && shortSide >= 600;
  return tabletUA || largeTouchDevice;
};

// Detectar Samsung Galaxy
export const isSamsungGalaxy = () => {
  return navigator.userAgent.includes('SM-');
};

// Detectar orientação
export const isLandscape = () => {
  return window.matchMedia('(orientation: landscape)').matches;
};

// Detectar modo DeX
export const isDeXMode = () => {
  return navigator.userAgent.includes('DeX');
};

// Detectar touchscreen
export const isTouchDevice = () => {
  return (
    (typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        navigator.maxTouchPoints > 0)) ||
    false
  );
};

// Otimizar animações para performance
export const reduceMotion = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

// Detectar modo performance
export const isLowPerformance = () => {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 2;
  const ram = navigator.deviceMemory || 4;
  return cores <= 2 || ram <= 2;
};

// Otimizações recomendadas
export const getTabletOptimizations = () => {
  const tablet = isTablet();
  const landscape = isLandscape();
  const lowPerf = isLowPerformance();
  const motionReduced = reduceMotion();

  return {
    disableAnimations: lowPerf || motionReduced,
    disableBlur: lowPerf,
    largerTouchTargets: tablet,
    horizontalLayout: landscape,
    reduceReRenders: lowPerf,
    optimizeImages: lowPerf || tablet,
    useLazyLoading: true,
    reduceMemory: lowPerf,
  };
};

// CSS para tablet optimization
export const tabletCSS = `
  @media (min-width: 1024px) and (orientation: landscape) {
    /* Landscape tablet optimizations */
    body {
      overflow-x: hidden;
    }

    /* Disable heavy animations */
    * {
      transition-duration: 0.15s !important;
    }

    /* Larger touch targets */
    button, a, input {
      min-height: 3rem;
      min-width: 3rem;
    }

  }

  /* Reduce blur for performance */
  .backdrop-blur {
    backdrop-filter: none;
    background-color: rgba(0, 0, 0, 0.5);
  }

  /* Optimize animations */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Samsung DeX optimizations */
  @media (display-mode: window-controls-overlay) {
    body {
      padding-top: env(titlebar-area-height, 0);
    }
  }
`;

// Aplicar otimizações (idempotente — nunca duplica a tag)
export const applyTabletOptimizations = () => {
  if (typeof document === 'undefined') return;
  const STYLE_ID = 'tablet-optimizations-style';
  if (document.getElementById(STYLE_ID)) return; // já aplicado, não duplicar
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = tabletCSS;
  document.head.appendChild(style);
};

// Throttle para eventos
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Debounce para input
export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};