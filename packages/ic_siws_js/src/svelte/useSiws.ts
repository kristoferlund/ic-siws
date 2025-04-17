import { getContext } from 'svelte';
import type { Readable } from 'svelte/store';
import type { SiwsIdentityContextType } from '..';
import { SiwsContextKey } from './context';

/**
 * Hook to access SIWS identity context in Svelte components.
 * Returns a Svelte readable store with the SIWS identity context.
 */
export function useSiws(): Readable<SiwsIdentityContextType> {
  const store = getContext<Readable<SiwsIdentityContextType>>(SiwsContextKey);
  if (!store) {
    throw new Error('useSiws must be used within a SiwsIdentityProvider');
  }
  return store;
}