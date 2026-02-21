import { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';

export function useTimer() {
  const isActive = useSessionStore((s) => s.isActive);
  const tickTimer = useSessionStore((s) => s.tickTimer);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(tickTimer, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, tickTimer]);
}
