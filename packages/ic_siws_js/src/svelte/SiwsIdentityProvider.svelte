<script lang="ts">
  import { setContext } from 'svelte';
  import { readable } from 'svelte/store';
  import { SiwsManager, siwsStateStore } from '..';
  import type { ActorConfig, HttpAgentOptions } from '@dfinity/agent';
  import type { SignInMessageSignerWalletAdapter } from '@solana/wallet-adapter-base';
  import type { SiwsIdentityContextType } from '..';
  import { SiwsContextKey } from './context';

  export let canisterId: string;
  export let adapter?: SignInMessageSignerWalletAdapter;
  export let httpAgentOptions?: HttpAgentOptions;
  export let actorOptions?: ActorConfig;

  // Initialize the SIWS manager
  const siwsManager = new SiwsManager(canisterId, adapter, httpAgentOptions, actorOptions);

  // Map internal context to public interface
  function mapContext(ctx: any): SiwsIdentityContextType {
    return {
      isInitializing: ctx.isInitializing,
      setAdapter: (adapter: SignInMessageSignerWalletAdapter) => siwsManager.setAdapter(adapter),
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

  // Create readable store from state store
  const initial = mapContext(siwsStateStore.getSnapshot().context);
  const store = readable<SiwsIdentityContextType>(initial, (set) => {
    const subscription = siwsStateStore.subscribe(({ context }) => {
      set(mapContext(context));
    });
    return () => subscription.unsubscribe();
  });

  // Provide store via Svelte context
  setContext(SiwsContextKey, store);
</script>

<slot />
