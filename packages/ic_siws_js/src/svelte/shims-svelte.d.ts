// TypeScript shims for Svelte imports
declare module 'svelte' {
  export function setContext(key: any, value: any): void;
  export function getContext<T>(key: any): T;
  export interface SvelteComponentTyped<Props = any, Events = any, Slots = any> {
    $$prop_def: Props;
  }
  export default class SvelteComponentTypedClass<Props = any, Events = any, Slots = any> {}
}

declare module 'svelte/store' {
  export interface Readable<T> {
    subscribe(run: (value: T) => void): { unsubscribe(): void };
  }
  export function readable<T>(value: T, start?: (set: (value: T) => void) => () => void): Readable<T>;
}

declare module '*.svelte' {
  import { SvelteComponentTyped } from 'svelte';
  const Component: SvelteComponentTyped<any, any, any>;
  export default Component;
}