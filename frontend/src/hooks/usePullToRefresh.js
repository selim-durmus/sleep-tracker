import { useCallback, useRef, useState } from 'react';

const THRESHOLD = 70;
const MAX = 120;
const RESISTANCE = 0.55;

function findScrollable(el) {
  while (el && el.nodeType === 1) {
    if (el.scrollHeight > el.clientHeight) {
      const style = window.getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return el;
      }
    }
    el = el.parentElement;
  }
  return null;
}

export function usePullToRefresh(onRefresh) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const ptrStartY = useRef(null);
  const scrollable = useRef(null);

  const onTouchStart = useCallback((e) => {
    if (refreshing) return;
    scrollable.current = findScrollable(e.target);
    ptrStartY.current = null;
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (refreshing) return;
    const finger = e.touches[0].clientY;
    const s = scrollable.current;
    if (s && s.scrollTop > 0) {
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
