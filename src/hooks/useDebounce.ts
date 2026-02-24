import { useCallback, useRef } from 'react';

export function useDebounce(cooldownMs: number) {
  const lastTapRef = useRef<number>(0);

  const isAllowed = useCallback((): boolean => {
    const now = Date.now();
    if (now - lastTapRef.current >= cooldownMs) {
      lastTapRef.current = now;
      return true;
    }
    return false;
  }, [cooldownMs]);

  const reset = useCallback(() => {
    lastTapRef.current = 0;
  }, []);

  return { isAllowed, reset };
}
