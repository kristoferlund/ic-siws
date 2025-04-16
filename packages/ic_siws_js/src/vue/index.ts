import { provide, inject, reactive, onMounted, onUnmounted } from "vue";
import { SiwsManager, siwsStateStore, type SiwsIdentityContextType } from "..";
import type { ActorConfig, HttpAgentOptions } from "@dfinity/agent";
import type { SignInMessageSignerWalletAdapter } from "@solana/wallet-adapter-base";

const SiwsIdentityProvider = Symbol("SiwsIdentityProvider");

export function createSiwsIdentityProvider({
  canisterId,
  adapter,
  httpAgentOptions,
  actorOptions,
}: {
  canisterId: string;
  adapter?: SignInMessageSignerWalletAdapter;
  httpAgentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
}) {
  const siwsManager = new SiwsManager(
    canisterId,
    adapter,
    httpAgentOptions,
    actorOptions,
  );

  const state = reactive({
    ...siwsStateStore.getSnapshot().context,
    isPreparingLogin: false,
    isPrepareLoginError: false,
    isPrepareLoginSuccess: false,
    isPrepareLoginIdle: true,
    isLoggingIn: false,
    isLoginError: false,
    isLoginSuccess: false,
    isLoginIdle: true,
    prepareLogin: async () => await siwsManager.prepareLogin(),
    login: async () => await siwsManager.login(),
    clear: () => siwsManager.clear(),
  });

  onMounted(() => {
    const subscription = siwsStateStore.subscribe(({ context }) => {
      const {
        isInitializing,
        prepareLoginStatus,
        prepareLoginError,
        loginStatus,
        loginError,
        signMessageStatus,
        signMessageError,
        delegationChain,
        identity,
        identityPublicKey: identityAddress,
      } = context;

      state.isInitializing = isInitializing;
      state.prepareLoginStatus = prepareLoginStatus;
      state.isPreparingLogin = prepareLoginStatus === "preparing";
      state.isPrepareLoginError = prepareLoginStatus === "error";
      state.isPrepareLoginSuccess = prepareLoginStatus === "success";
      state.isPrepareLoginIdle = prepareLoginStatus === "idle";
      state.prepareLoginError = prepareLoginError;
      state.loginStatus = loginStatus;
      state.isLoggingIn = loginStatus === "logging-in";
      state.isLoginError = loginStatus === "error";
      state.isLoginSuccess = loginStatus === "success";
      state.isLoginIdle = loginStatus === "idle";
      state.loginError = loginError;
      state.signMessageStatus = signMessageStatus;
      state.signMessageError = signMessageError;
      state.delegationChain = delegationChain;
      state.identity = identity;
      state.identityPublicKey = identityAddress;
    });

    onUnmounted(() => {
      subscription.unsubscribe();
    });
  });

  provide(SiwsIdentityProvider, state);
}

export function useSiws() {
  const context = inject<SiwsIdentityContextType | undefined>(
    SiwsIdentityProvider,
  );
  if (!context) {
    throw new Error("useSiws must be used within a SiwsIdentityProvider");
  }
  return context;
}
