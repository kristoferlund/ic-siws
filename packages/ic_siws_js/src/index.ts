import { createStore } from "@xstate/store";
import {
  Ed25519KeyIdentity,
  type DelegationChain,
  DelegationIdentity,
} from "@dfinity/identity";
import type { ActorConfig, HttpAgentOptions } from "@dfinity/agent";
import {
  callGetDelegation,
  callLogin,
  callPrepareLogin,
  createAnonymousActor,
} from "./siws-provider";
import { normalizeError } from "./error";
import { createDelegationChain } from "./delegation";
import { clearIdentity, loadIdentity, saveIdentity } from "./local-storage";
import type {
  LoginStatus,
  PrepareLoginStatus,
  SignMessageStatus,
} from "./context.type";
import { idlFactory } from "./ic_siws_provider.did";
import type { SiwsMessage } from "./service.interface";
import type { SignInMessageSignerWalletAdapter } from "@solana/wallet-adapter-base";
import bs58 from "bs58";
import type { PublicKey } from "@solana/web3.js";

export * from "./context.type";
export * from "./service.interface";
export * from "./storage.type";

interface Context {
  isInitializing: boolean;
  prepareLoginStatus: PrepareLoginStatus;
  prepareLoginError?: Error;
  prepareLoginOkResponse?: SiwsMessage;
  loginStatus: LoginStatus;
  loginError?: Error;
  signMessageStatus: SignMessageStatus;
  signMessageError?: Error;
  identity?: DelegationIdentity;
  identityPublicKey?: PublicKey;
  delegationChain?: DelegationChain;
}

type PartialContext = Partial<Context>;

const initialContext: Context = {
  isInitializing: true,
  prepareLoginStatus: "idle",
  loginStatus: "idle",
  signMessageStatus: "idle",
};

export const siwsStateStore = createStore({
  context: initialContext,
  on: {
    updateState: (context, updates: PartialContext) => {
      return { ...context, ...updates };
    },
  },
});

export class SiwsManager {
  /**
   * The IdentityManager is the starting point for using the SIWS identity service. It manages the identity state and provides authentication-related functionalities.
   *
   * @param {string} canisterId - The unique identifier of the canister on the Internet Computer network. This ID is used to establish a connection to the canister.
   * @param {HttpAgentOptions} httpAgentOptions - Optional. Configuration options for the HTTP agent used to communicate with the Internet Computer network.
   * @param {ActorConfig} actorOptions - Optional. Configuration options for the actor. These options are passed to the actor upon its creation.
   */
  constructor(
    public canisterId: string,
    public adapter?: SignInMessageSignerWalletAdapter,
    public httpAgentOptions?: HttpAgentOptions,
    public actorOptions?: ActorConfig,
  ) {
    try {
      // Attempt to load a stored identity from local storage.
      const [identityPublicKey, identity, delegationChain] = loadIdentity();
      this.updateState({
        identityPublicKey,
        identity,
        delegationChain,
      });
    } catch (e) {
      const error = normalizeError(e);
      console.log(`IdentityManager: ${error.message}`);
    }
    this.updateState({ isInitializing: false });
  }

  /**
   * Convenience method to update the state.
   */
  updateState(updates: PartialContext) {
    siwsStateStore.send({ type: "updateState", ...updates });
  }

  /**
   * Provide a `WalletClient` instance to the `SiweManager` if you want to
   * override the default wallet client (`window.ethereum`). Must be
   * called before calling `prepareLogin` or `login` to use, for instance, a
   * WalletConnect provider.
   */
  // public setWalletClient(walletClient: WalletClient) {
  //   this.walletClient = walletClient;
  // }

  public async setAdapter(adapter: SignInMessageSignerWalletAdapter) {
    this.adapter = adapter;
  }

  /**
   * Load a SIWE message from the provider canister, to be used for login. Calling prepareLogin
   * is optional, as it will be called automatically on login if not called manually.
   */
  public async prepareLogin(): Promise<SiwsMessage | undefined> {
    try {
      if (!this.adapter) {
        throw new Error(
          "No Solana adapter available. Call setAdapter before calling prepareLogin or include adapter in the constructor.",
        );
      }

      if (!this.adapter.publicKey) {
        throw new Error(
          "No Solana public key available. Call prepareLogin after the user has connected their wallet.",
        );
      }

      this.updateState({
        prepareLoginStatus: "preparing",
        prepareLoginError: undefined,
      });

      const actor = await createAnonymousActor({
        idlFactory,
        canisterId: this.canisterId,
        httpAgentOptions: this.httpAgentOptions,
        actorOptions: this.actorOptions,
      });

      const response = await callPrepareLogin(actor, this.adapter.publicKey);
      this.updateState({
        prepareLoginOkResponse: response,
        prepareLoginStatus: "success",
      });

      return response;
    } catch (e) {
      const error = normalizeError(e);
      console.error(error);
      this.updateState({
        prepareLoginStatus: "error",
        prepareLoginError: error,
      });
      throw error;
    }
  }

  /**
   * Initiates the login process. If a SIWE message is not already available, it will be
   * generated by calling prepareLogin.
   */
  public async login(): Promise<DelegationIdentity | undefined> {
    try {
      if (
        siwsStateStore.getSnapshot().context.prepareLoginStatus === "preparing"
      ) {
        throw new Error("Don't call login while prepareLogin is in progress");
      }

      if (siwsStateStore.getSnapshot().context.loginStatus === "logging-in") {
        throw new Error("Don't call login while login is in progress");
      }

      if (!this.adapter) {
        throw new Error(
          "No Solana adapter available. Call setAdapter before calling prepareLogin or include adapter in the constructor.",
        );
      }

      if (!this.adapter.publicKey) {
        throw new Error(
          "No Solana public key available. Call prepareLogin after the user has connected their wallet.",
        );
      }

      this.updateState({
        loginStatus: "logging-in",
        loginError: undefined,
        signMessageError: undefined,
      });

      // The SIWE message is fetched from the provider canister now if it is not already available.
      let siwsMessage =
        siwsStateStore.getSnapshot().context.prepareLoginOkResponse;
      if (!siwsMessage) {
        siwsMessage = await this.prepareLogin();
        if (!siwsMessage) {
          throw new Error(
            "Prepare login failed did not return a SIWE message.",
          );
        }
      }

      this.updateState({
        signMessageStatus: "pending",
      });

      let signature;
      try {
        // expiration_time and issued_at are in nanoseconds, convert to milliseconds.
        const expMilliseconds = Number(
          siwsMessage.expiration_time / BigInt(1000000),
        );
        const issuedAtMilliseconds = Number(
          siwsMessage.issued_at / BigInt(1000000),
        );

        // Display the SIWS message for the user to sign.
        const result = await this.adapter.signIn({
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
          throw new Error("signMessage returned no data.");
        }

        signature = result.signature;
      } catch (e) {
        const error = normalizeError(e);
        console.error(error);
        this.updateState({
          signMessageStatus: "error",
          signMessageError: error,
        });
        throw error;
      }

      this.updateState({
        signMessageStatus: "success",
      });

      // Important for security! A random session identity is created on each login.
      const sessionIdentity = Ed25519KeyIdentity.generate();
      const sessionPublicKey = sessionIdentity.getPublicKey().toDer();

      const actor = await createAnonymousActor({
        idlFactory,
        canisterId: this.canisterId,
        httpAgentOptions: this.httpAgentOptions,
        actorOptions: this.actorOptions,
      });

      const loginOkResponse = await callLogin(
        actor,
        bs58.encode(signature),
        this.adapter.publicKey,
        sessionPublicKey,
        siwsMessage.nonce,
      );

      // Call the backend's siwe_get_delegation method to get the delegation.
      const signedDelegation = await callGetDelegation(
        actor,
        this.adapter.publicKey,
        sessionPublicKey,
        loginOkResponse.expiration,
      );

      // Create a new delegation chain from the delegation.
      const delegationChain = createDelegationChain(
        signedDelegation,
        loginOkResponse.user_canister_pubkey,
      );

      // Create a new delegation identity from the session identity and the
      // delegation chain.
      const identity = DelegationIdentity.fromDelegation(
        sessionIdentity,
        delegationChain,
      );

      // Save the identity for future use.
      saveIdentity(this.adapter.publicKey, sessionIdentity, delegationChain);

      this.updateState({
        loginStatus: "success",
        identityPublicKey: this.adapter.publicKey,
        identity,
        delegationChain,
      });

      return identity;
    } catch (e) {
      const error = normalizeError(e);
      console.error(error);
      this.updateState({
        prepareLoginOkResponse: undefined,
        loginStatus: "error",
        loginError: error,
      });
      throw error;
    }
  }

  /**
   * Clears the state and local storage. Effectively "logs the user out".
   */
  public clear() {
    this.updateState({
      prepareLoginStatus: "idle",
      prepareLoginError: undefined,
      prepareLoginOkResponse: undefined,
      loginStatus: "idle",
      loginError: undefined,
      signMessageError: undefined,
      identity: undefined,
      identityPublicKey: undefined,
      delegationChain: undefined,
    });
    clearIdentity();
  }
}
