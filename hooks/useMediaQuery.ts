'use client';

import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string) {
  const getSnapshot = () => window.matchMedia(query).matches;

  const subscribe = (notify: () => void) => {
    const media = window.matchMedia(query);
    const listener = () => notify();

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}