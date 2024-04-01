import type { ActorMethod } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";

export type Address = string;

export type CanisterPublicKey = PublicKey;

export interface Delegation {
  pubkey: PublicKey;
  targets: [] | [Array<Principal>];
  expiration: Timestamp;
}

export type GetDelegationResponse = { Ok: SignedDelegation } | { Err: string };

export interface LoginDetails {
  user_canister_pubkey: CanisterPublicKey;
  expiration: Timestamp;
}

export type LoginResponse = { Ok: LoginDetails } | { Err: string };

export type PrepareLoginResponse = { Ok: SiwsMessage } | { Err: string };

export type PublicKey = Uint8Array | number[];

export type SessionKey = PublicKey;

export interface SignedDelegation {
  signature: Uint8Array | number[];
  delegation: Delegation;
}
export interface SiwsMessage {
  uri: string;
  issued_at: bigint;
  domain: string;
  statement: string;
  version: number;
  chain_id: string;
  address: Address;
  nonce: string;
  expiration_time: bigint;
}

export type SiwsSignature = string;

export type Timestamp = bigint;
export interface SIWS_IDENTITY_SERVICE {
  siws_get_delegation: ActorMethod<
    [Address, SessionKey, Timestamp],
    GetDelegationResponse
  >;
  siws_login: ActorMethod<[SiwsSignature, Address, SessionKey], LoginResponse>;
  siws_prepare_login: ActorMethod<[Address], PrepareLoginResponse>;
}
