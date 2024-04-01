/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { type ActorConfig, type HttpAgentOptions } from "@dfinity/agent";
import { DelegationIdentity, Ed25519KeyIdentity } from "@dfinity/identity";
import type { SiwsIdentityContextType } from "./context.type";
import { IDL } from "@dfinity/candid";
import type {
  LoginDetails,
  SIWS_IDENTITY_SERVICE,
  SignedDelegation as ServiceSignedDelegation,
} from "./service.interface";
import { clearIdentity, loadIdentity, saveIdentity } from "./local-storage";
import {
  callGetDelegation,
  callLogin,
  callPrepareLogin,
  createAnonymousActor,
} from "./siws-provider";
import type { SiwsMessage, State } from "./state.type";
import { createDelegationChain } from "./delegation";
import { normalizeError } from "./error";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

/**
 * Re-export types
 */
export * from "./context.type";
export * from "./service.interface";
export * from "./storage.type";

/**
 * React context for managing SIWS (Sign-In with Solana) identity.
 */
export const SiwsIdentityContext = createContext<
  SiwsIdentityContextType | undefined
>(undefined);

/**
 * Hook to access the SiwsIdentityContext.
 */
export const useSiwsIdentity = (): SiwsIdentityContextType => {
  const context = useContext(SiwsIdentityContext);
  if (!context) {
    throw new Error(
      "useSiwsIdentity must be used within an SiwsIdentityProvider"
    );
  }
  return context;
};

/**
 * Provider component for the SIWS identity context. Manages identity state and provides authentication-related functionalities.
 *
 * @prop {IDL.InterfaceFactory} idlFactory - Required. The Interface Description Language (IDL) factory for the canister. This factory is used to create an actor interface for the canister.
 * @prop {string} canisterId - Required. The unique identifier of the canister on the Internet Computer network. This ID is used to establish a connection to the canister.
 * @prop {HttpAgentOptions} httpAgentOptions - Optional. Configuration options for the HTTP agent used to communicate with the Internet Computer network.
 * @prop {ActorConfig} actorOptions - Optional. Configuration options for the actor. These options are passed to the actor upon its creation.
 * @prop {ReactNode} children - Required. The child components that the SiwsIdentityProvider will wrap. This allows any child component to access the authentication context provided by the SiwsIdentityProvider.
 *
 * @example
 * ```tsx
 * import { SiwsIdentityProvider } from 'ic-use-siws-identity';
 * import { _SERVICE } from "[DECLARATIONS PATH]/declarations/ic_siws_provider/ic_siws_provider.did";
 * import {
 *   canisterId,
 *   idlFactory,
 * } from "[DECLARATIONS PATH]/declarations/ic_siws_provider/index";
 *
 * ReactDOM.createRoot(document.getElementById("root")!).render(
 *   <React.StrictMode>
 *     <SolanaProviders>
 *       <SiwsIdentityProvider<_SERVICE>
 *         canisterId={canisterId}
 *         idlFactory={idlFactory}
 *       >
 *         <Actors>
 *           <AuthGuard>
 *             <App />
 *           </AuthGuard>
 *         </Actors>
 *       </SiwsIdentityProvider>
 *     </SolanaProviders>
 *   </React.StrictMode>
 * );
 *```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SiwsIdentityProvider<T extends SIWS_IDENTITY_SERVICE>({
  httpAgentOptions,
  actorOptions,
  idlFactory,
  canisterId,
  children,
}: {
  /** Configuration options for the HTTP agent used to communicate with the Internet Computer network. */
  httpAgentOptions?: HttpAgentOptions;

  /** Configuration options for the actor. These options are passed to the actor upon its creation. */
  actorOptions?: ActorConfig;

  /** The Interface Description Language (IDL) factory for the canister. This factory is used to create an actor interface for the canister. */
  idlFactory: IDL.InterfaceFactory;

  /** The unique identifier of the canister on the Internet Computer network. This ID is used to establish a connection to the canister. */
  canisterId: string;

  /** The child components that the SiwsIdentityProvider will wrap. This allows any child component to access the authentication context provided by the SiwsIdentityProvider. */
  children: ReactNode;
}) {
  const { publicKey, signIn, connecting } = useWallet();

  const [state, setState] = useState<State>({
    isInitializing: true,
    prepareLoginStatus: "idle",
    loginStatus: "idle",
  });

  function updateState(newState: Partial<State>) {
    setState((prevState) => ({
      ...prevState,
      ...newState,
    }));
  }

  /**
   * Load a SIWS message from the provider, to be used for login. Calling prepareLogin
   * is optional, as it will be called automatically on login if not called manually.
   */
  async function prepareLogin(): Promise<SiwsMessage | undefined> {
    if (!state.anonymousActor) {
      throw new Error(
        "Hook not initialized properly. Make sure to supply all required props to the SiwsIdentityProvider."
      );
    }
    if (!publicKey) {
      throw new Error(
        "No Solana public key available. Call prepareLogin after the user has connected their wallet."
      );
    }

    updateState({
      prepareLoginStatus: "preparing",
      prepareLoginError: undefined,
    });

    try {
      const siwsMessage = await callPrepareLogin(
        state.anonymousActor,
        publicKey
      );
      updateState({
        siwsMessage: siwsMessage,
        prepareLoginStatus: "success",
      });
      return siwsMessage;
    } catch (e) {
      const error = normalizeError(e);
      console.error(error);
      updateState({
        prepareLoginStatus: "error",
        prepareLoginError: error,
      });
    }
  }

  async function setLoginError(error: Error | unknown, message?: string) {
    const e = normalizeError(error);
    const errorMessage = message || e.message;

    console.error(e);

    updateState({
      siwsMessage: undefined,
      loginStatus: "error",
      loginError: new Error(errorMessage),
    });
  }

  /**
   * Initiates the login process. If a SIWS message is not already available, it will be
   * generated by calling prepareLogin.
   *
   * @returns {void} Login does not return anything. If an error occurs, the error is available in
   * the loginError property.
   */
  async function login() {
    if (!state.anonymousActor) {
      setLoginError(
        new Error(
          "Hook not initialized properly. Make sure to supply all required props to the SiwsIdentityProvider."
        )
      );
      return;
    }
    if (!publicKey) {
      setLoginError(
        new Error(
          "No Solana public key available. Call login after the user has connected their wallet."
        )
      );
      return;
    }
    if (state.prepareLoginStatus === "preparing") {
      setLoginError(
        new Error("Don't call login while prepareLogin is running.")
      );
      return;
    }

    updateState({
      loginStatus: "logging-in",
      loginError: undefined,
    });

    try {
      // The SIWS message can be prepared in advance, or it can be generated as part of the login process.
      let siwsMessage = state.siwsMessage;
      if (!siwsMessage) {
        siwsMessage = await prepareLogin();
        if (!siwsMessage) {
          setLoginError(
            new Error("Prepare login failed did not return a SIWS message.")
          );
          return;
        }
      }

      // expiration_time and issued_at are in nanoseconds, convert to milliseconds.
      const expMilliseconds = Number(
        siwsMessage.expiration_time / BigInt(1000000)
      );
      const issuedAtMilliseconds = Number(
        siwsMessage.issued_at / BigInt(1000000)
      );

      // Display the SIWS message for the user to sign.
      const result = await signIn?.({
        address: siwsMessage.address,
        chainId: siwsMessage.chain_id,
        domain: siwsMessage.domain,
        expirationTime: new Date(expMilliseconds).toISOString(),
        issuedAt: new Date(issuedAtMilliseconds).toISOString(),
        nonce: siwsMessage.nonce,
        uri: siwsMessage.uri,
        version: siwsMessage.version.toString(),
        statement: siwsMessage.statement,
      });

      if (!result || !result.signature) {
        setLoginError(new Error("Sign message returned no data."));
        return;
      }

      // Important for security! A random session identity is created on each login.
      const sessionIdentity = Ed25519KeyIdentity.generate();
      const sessionPublicKey = sessionIdentity.getPublicKey().toDer();

      // Logging in is a two-step process. First, the signed SIWS message is sent to the backend.
      // Then, the backend's siws_get_delegation method is called to get the delegation.
      let loginDetails: LoginDetails;
      try {
        loginDetails = await callLogin(
          state.anonymousActor,
          bs58.encode(result.signature),
          publicKey,
          sessionPublicKey
        );
      } catch (e) {
        setLoginError(e, "Unable to login.");
        return;
      }

      // Call the backend's siws_get_delegation method to get the delegation.
      let signedDelegation: ServiceSignedDelegation;
      try {
        signedDelegation = await callGetDelegation(
          state.anonymousActor,
          publicKey,
          sessionPublicKey,
          loginDetails.expiration
        );
      } catch (e) {
        setLoginError(e, "Unable to get identity.");
        return;
      }

      // Create a new delegation chain from the delegation.
      const delegationChain = createDelegationChain(
        signedDelegation,
        loginDetails.user_canister_pubkey
      );

      // Create a new delegation identity from the session identity and the
      // delegation chain.
      const identity = DelegationIdentity.fromDelegation(
        sessionIdentity,
        delegationChain
      );

      // Save the identity to local storage.
      saveIdentity(publicKey, sessionIdentity, delegationChain);

      // Set the identity in state.
      updateState({
        loginStatus: "success",
        identityAddress: publicKey,
        identity,
        delegationChain,
      });

      return identity;
    } catch (e) {
      setLoginError(e);
    }
  }

  /**
   * Clears the state and local storage. Effectively "logs the user out".
   */
  function clear() {
    updateState({
      isInitializing: false,
      prepareLoginStatus: "idle",
      prepareLoginError: undefined,
      siwsMessage: undefined,
      loginStatus: "idle",
      loginError: undefined,
      identity: undefined,
      identityAddress: undefined,
      delegationChain: undefined,
    });
    clearIdentity();
  }

  /**
   * Load the identity from local storage on mount.
   */
  useEffect(() => {
    try {
      const [a, i, d] = loadIdentity();
      updateState({
        identityAddress: a,
        identity: i,
        delegationChain: d,
        isInitializing: false,
      });
    } catch (e) {
      if (e instanceof Error) {
        console.log("No identity loaded: ", e.message);
      }
      updateState({
        isInitializing: false,
      });
    }
  }, []);

  /**
   * On address change, reset the state. Action is conditional on state.isInitializing
   * being false.
   */
  useEffect(() => {
    if (state.isInitializing || connecting || !state.identityAddress) return;
    if (publicKey?.equals(state.identityAddress)) return;
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  /**
   * Create an anonymous actor on mount. This actor is used during the login
   * process.
   */
  useEffect(() => {
    const a = createAnonymousActor({
      idlFactory,
      canisterId,
      httpAgentOptions,
      actorOptions,
    });
    updateState({
      anonymousActor: a,
    });
  }, [idlFactory, canisterId, httpAgentOptions, actorOptions]);

  return (
    <SiwsIdentityContext.Provider
      value={{
        ...state,
        prepareLogin,
        isPreparingLogin: state.prepareLoginStatus === "preparing",
        isPrepareLoginError: state.prepareLoginStatus === "error",
        isPrepareLoginSuccess: state.prepareLoginStatus === "success",
        isPrepareLoginIdle: state.prepareLoginStatus === "idle",
        login,
        isLoggingIn: state.loginStatus === "logging-in",
        isLoginError: state.loginStatus === "error",
        isLoginSuccess: state.loginStatus === "success",
        isLoginIdle: state.loginStatus === "idle",
        clear,
      }}
    >
      {children}
    </SiwsIdentityContext.Provider>
  );
}
