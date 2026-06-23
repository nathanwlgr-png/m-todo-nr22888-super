import { useCallback, useRef, useState } from 'react';

export default function useActionLock(defaultDelayMs = 800) {
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);

  const runWithLock = useCallback(async (action, delayMs = defaultDelayMs) => {
    if (lockedRef.current) return false;
    lockedRef.current = true;
    setLocked(true);

    const startedAt = Date.now();
    try {
      return await action();
    } finally {
      const remaining = Math.max(0, delayMs - (Date.now() - startedAt));
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
      lockedRef.current = false;
      setLocked(false);
    }
  }, [defaultDelayMs]);

  return { locked, runWithLock };
}