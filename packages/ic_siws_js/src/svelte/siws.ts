// src/svelte/siws.ts
import { readable, type Readable, type Subscriber } from "svelte/store";
import { SiwsManager, siwsStateStore, type SiwsIdentityContextType } from "..";
import type { Adapter } from "@solana/wallet-adapter-base";
import type { ActorConfig, HttpAgentOptions } from "@dfinity/agent";

let manager: SiwsManager;

/** One-time initialization.
 * Call from your top-level (e.g. `App.svelte`) before using the store. */
export function init(
  canisterId: string,
  adapter?: Adapter,
  httpAgentOptions?: HttpAgentOptions,
  actorOptions?: ActorConfig,
) {
  manager = new SiwsManager(
    canisterId,
    adapter,
    httpAgentOptions,
    actorOptions,
  );
}

// Project the XState context to our public interface
function mapContext(ctx: any): SiwsIdentityContextType {
  return {
    isInitializing: ctx.isInitializing,
    setAdapter: (a) => manager.setAdapter(a),
    prepareLogin: () => manager.prepareLogin(),
    prepareLoginStatus: ctx.prepareLoginStatus,
    isPreparingLogin: ctx.prepareLoginStatus === "preparing",
    isPrepareLoginError: ctx.prepareLoginStatus === "error",
    isPrepareLoginSuccess: ctx.prepareLoginStatus === "success",
    isPrepareLoginIdle: ctx.prepareLoginStatus === "idle",
    prepareLoginError: ctx.prepareLoginError,
    login: () => manager.login(),
    loginStatus: ctx.loginStatus,
    isLoggingIn: ctx.loginStatus === "logging-in",
    isLoginError: ctx.loginStatus === "error",
    isLoginSuccess: ctx.loginStatus === "success",
    isLoginIdle: ctx.loginStatus === "idle",
    loginError: ctx.loginError,
    signMessageStatus: ctx.signMessageStatus,
    signMessageError: ctx.signMessageError,
    delegationChain: ctx.delegationChain,
    identity: ctx.identity,
    identityPublicKey: ctx.identityPublicKey,
    clear: () => manager.clear(),
  };
}

// The Svelte store that components will subscribe to.
export const siws: Readable<SiwsIdentityContextType> = {
  subscribe(run: Subscriber<SiwsIdentityContextType>) {
    run(mapContext(siwsStateStore.getSnapshot().context));
    const unsub = siwsStateStore.subscribe(({ context }) => {
      run(mapContext(context));
    });
    return () => unsub.unsubscribe();
  },
};
