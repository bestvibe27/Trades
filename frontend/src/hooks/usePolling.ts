import { useEffect, useRef } from 'react';

/**
 * Simple polling hook.
 * Calls `fn` immediately and then every `intervalMs` until unmounted.
 * If `immediate` is false, starts after first interval.
 */
export function usePolling(fn: () => void | Promise<void>, intervalMs = 10000, immediate = true) {
  const savedFn = useRef(fn);
  useEffect(() => {
    savedFn.current = fn;
  }, [fn]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let stopped = false;

    const tick = async () => {
      try {
        await savedFn.current();
      } catch {
        // swallow
      } finally {
        if (!stopped) timer = setTimeout(tick, intervalMs);
      }
    };

    if (immediate) {
      tick();
    } else {
      timer = setTimeout(tick, intervalMs);
    }

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [intervalMs, immediate]);
}
