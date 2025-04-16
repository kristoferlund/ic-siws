import React, { createContext, useContext, useMemo } from "react";
import { SiwsManager, siwsStateStore, type SiwsIdentityContextType } from "..";
import type { ActorConfig, HttpAgentOptions } from "@dfinity/agent";
import { useSelector } from "@xstate/store/react";
import type { SignInMessageSignerWalletAdapter } from "@solana/wallet-adapter-base";

const SiwsContext = createContext<SiwsIdentityContextType | undefined>(
  undefined,
);

export function SiwsIdentityProvider({
  canisterId,
  adapter,
  httpAgentOptions,
  actorOptions,
  children,
}: {
  canisterId: string;
  adapter?: SignInMessageSignerWalletAdapter;
  httpAgentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
  children: React.ReactNode;
}) {
  const siwsManager = useMemo(
    () => new SiwsManager(canisterId, adapter, httpAgentOptions, actorOptions),
    [canisterId, adapter, httpAgentOptions, actorOptions],
  );

  const state = useSelector(siwsStateStore, (state) => state.context);

  return (
    <SiwsContext.Provider
      value={{
        ...state,
        prepareLogin: () => siwsManager.prepareLogin(),
        isPreparingLogin: state.prepareLoginStatus === "preparing",
        isPrepareLoginError: state.prepareLoginStatus === "error",
        isPrepareLoginSuccess: state.prepareLoginStatus === "success",
        isPrepareLoginIdle: state.prepareLoginStatus === "idle",
        login: () => siwsManager.login(),
        isLoggingIn: state.loginStatus === "logging-in",
        isLoginError: state.loginStatus === "error",
        isLoginSuccess: state.loginStatus === "success",
        isLoginIdle: state.loginStatus === "idle",
        clear: () => siwsManager.clear(),
      }}
    >
      {children}
    </SiwsContext.Provider>
  );
}

export function useSiws() {
  const context = useContext(SiwsContext);
  if (!context) {
    throw new Error("useSiws must be used within a SiwsIdentityProvider");
  }
  return context;
}
