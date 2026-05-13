/**
 * Samsung Galaxy Tab S11 - Performance & UX Optimization
 * Otimizações para excelente experiência em tablet
 */

(function() {
  // 1. Disable animations for low-performance devices
  if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    document.documentElement.style.setProperty('--tw-duration', '0ms');
  }

  // 2. Optimize for landscape orientation
  if (window.matchMedia('(orientation: landscape)').matches) {
    document.documentElement.setAttribute('data-layout', 'landscape');
  }

  // 3. Detect Samsung DeX Mode
  if (navigator.userAgent.includes('DeX')) {
    document.documentElement.setAttribute('data-dex-mode', 'true');
  }

  // 4. Lock orientation for tablet
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {
      // Fallback - orientation lock not supported
    });
  }

  // 5. Optimize memory - cleanup intervals
  window.addEventListener('pagehide', function() {
    // Cancel all timers and intervals
    for (let i = 0; i < 99999; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
  });

  // 6. Reduce animation frame usage
  const originalRAF = window.requestAnimationFrame;
  let rafScheduled = false;
  let rafQueue = [];

  window.requestAnimationFrame = function(callback) {
    rafQueue.push(callback);
    if (!rafScheduled) {
      rafScheduled = true;
      originalRAF(function() {
        rafScheduled = false;
        const queue = rafQueue.splice(0);
        queue.forEach(cb => {
          try { cb(performance.now()); } catch (e) {}
        });
      });
    }
  };

  // 7. Add touch optimization class
  if ('ontouchstart' in window) {
    document.documentElement.classList.add('touch-device');
  }

  // 8. Optimize images for tablet DPI
  if (window.devicePixelRatio > 1) {
    document.documentElement.setAttribute('data-dpi', 'high');
  }

  // 9. Disable passive listeners warning
  if (document.addEventListener) {
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(type, listener, options) {
      if (typeof options === 'object' && !options.passive) {
        options.passive = true;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  // 10. Memory management - cleanup on idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(function() {
      // Garbage collection hint
      if (window.gc) {
        try { window.gc(); } catch (e) {}
      }
    }, { timeout: 10000 });
  }

  // 11. Optimize localStorage for tablet
  try {
    const storage = window.localStorage;
    const keys = Object.keys(storage);
    const maxItems = 50;
    if (keys.length > maxItems) {
      keys.slice(0, keys.length - maxItems).forEach(key => {
        storage.removeItem(key);
      });
    }
  } catch (e) {}

  console.log('📱 Tablet optimization initialized');
})();
