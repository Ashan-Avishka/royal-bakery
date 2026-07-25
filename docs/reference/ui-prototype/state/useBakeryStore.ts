import { useSyncExternalStore } from 'react';
import { BakeryStore, defaultBakeryStore, SystemState } from './BakeryStore';

export function useBakeryStore(store: BakeryStore = defaultBakeryStore): SystemState {
  return useSyncExternalStore(
    (callback) => store.subscribe(callback),
    () => store.getState(),
    () => store.getState()
  );
}
