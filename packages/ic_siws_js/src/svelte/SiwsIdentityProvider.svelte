<script lang="ts">
  import { setContext } from 'svelte';
  import { readable, type Readable } from 'svelte/store';
  import { SiwsManager, siwsStateStore, type SiwsIdentityContextType } from '..';
  import type { ActorConfig, HttpAgentOptions } from '@dfinity/agent';
  import type { Adapter } from '@solana/wallet-adapter-base';
  import { SiwsContextKey } from "ic-siws-js/svelte";

  export let canisterId: string;
  export let adapter: Adapter | undefined = undefined;
  export let httpAgentOptions: HttpAgentOptions | undefined = undefined;
  export let actorOptions: ActorConfig | undefined = undefined;

  // Initialize the SIWS manager
  const siwsManager = new SiwsManager(
    canisterId,
    adapter,
    httpAgentOptions,
    actorOptions
  );

  // Map internal context to public interface
  function mapContext(ctx: any): SiwsIdentityContextType {
    return {
      isInitializing: ctx.isInitializing,
      setAdapter: (a: Adapter) => siwsManager.setAdapter(a),
      prepareLogin: () => siwsManager.prepareLogin(),
      prepareLoginStatus: ctx.prepareLoginStatus,
      isPreparingLogin: ctx.prepareLoginStatus === 'preparing',
      isPrepareLoginError: ctx.prepareLoginStatus === 'error',
      isPrepareLoginSuccess: ctx.prepareLoginStatus === 'success',
      isPrepareLoginIdle: ctx.prepareLoginStatus === 'idle',
      prepareLoginError: ctx.prepareLoginError,
      login: () => siwsManager.login(),
      loginStatus: ctx.loginStatus,
      isLoggingIn: ctx.loginStatus === 'logging-in',
      isLoginError: ctx.loginStatus === 'error',
      isLoginSuccess: ctx.loginStatus === 'success',
      isLoginIdle: ctx.loginStatus === 'idle',
      loginError: ctx.loginError,
      signMessageStatus: ctx.signMessageStatus,
      signMessageError: ctx.signMessageError,
      delegationChain: ctx.delegationChain,
      identity: ctx.identity,
      identityPublicKey: ctx.identityPublicKey,
      clear: () => siwsManager.clear(),
    };
  }

  // Create a readable store from the XState store
  const initial = mapContext(siwsStateStore.getSnapshot().context);
  const store: Readable<SiwsIdentityContextType> = readable(initial, (set) => {
    const subscription = siwsStateStore.subscribe(({ context }) => {
      set(mapContext(context));
    });
    return () => subscription.unsubscribe();
  });

  // Provide the store via Svelte context
  setContext(SiwsContextKey, store);
</script>

<slot />
