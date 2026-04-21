import { useRef, useState, useCallback } from 'react';

const THRESHOLD = 70;
const MAX = 120;
const RESISTANCE = 0.55;

export function usePullToRefresh(onRefresh) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const ptrStartY = useRef(null);
  const container = useRef(null);

  const onTouchStart = useCallback((e) => {
    if (refreshing) return;
    container.current = e.currentTarget;
    ptrStartY.current = null;
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (!container.current || refreshing) return;
    const finger = e.touches[0].clientY;
    if (container.current.scrollTop > 0) {
      if (ptrStartY.current != null) {
        ptrStartY.current = null;
        setPull(0);
      }
      return;
    }
    if (ptrStartY.current == null) {
      ptrStartY.current = finger;
      return;
    }
    const dy = finger - ptrStartY.current;
    if (dy <= 0) {
      setPull(0);
      return;
    }
    setPull(Math.min(MAX, dy * RESISTANCE));
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!container.current) return;
    const final = pull;
    ptrStartY.current = null;
    if (final >= THRESHOLD && onRefresh && !refreshing) {
      setRefreshing(true);
      setPull(0);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    } else {
      setPull(0);
    }
  }, [pull, onRefresh, refreshing]);

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    pull,
    refreshing,
    threshold: THRESHOLD
  };
}
