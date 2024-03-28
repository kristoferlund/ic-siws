import type { DelegationChain, DelegationIdentity } from "@dfinity/identity";

import type { ActorSubclass } from "@dfinity/agent";
import type { PublicKey } from "@solana/web3.js";
import type { SIWE_IDENTITY_SERVICE } from "./service.interface";

export type PrepareLoginStatus = "error" | "preparing" | "success" | "idle";
export type LoginStatus = "error" | "logging-in" | "success" | "idle";

export type SiwsMessage = {
  address: string;
  chain_id: string;
  domain: string;
  expiration_time: bigint;
  issued_at: bigint;
  nonce: string;
  statement: string;
  uri: string;
  version: number;
};

export type State = {
  anonymousActor?: ActorSubclass<SIWE_IDENTITY_SERVICE>;
  isInitializing: boolean;
  prepareLoginStatus: PrepareLoginStatus;
  prepareLoginError?: Error;
  siwsMessage?: SiwsMessage;
  loginStatus: LoginStatus;
  loginError?: Error;
  identity?: DelegationIdentity;
  identityPublicKey?: PublicKey;
  delegationChain?: DelegationChain;
};
