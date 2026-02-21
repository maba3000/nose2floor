import { useRef } from 'react';

export function useDebounce(cooldownMs: number) {
  const lastTapRef = useRef<number>(0);

  return function isAllowed(): boolean {
    const now = Date.now();
    if (now - lastTapRef.current >= cooldownMs) {
      lastTapRef.current = now;
      return true;
    }
    return false;
  };
}
