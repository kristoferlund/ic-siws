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

export interface LoginOkResponse {
  expiration: Timestamp;
  user_canister_pubkey: CanisterPublicKey;
}

export type LoginResponse = { Ok: LoginOkResponse } | { Err: string };

export interface SiwsMessage {
  domain: string;
  address: Address;
  statement: string;
  uri: string;
  version: number;
  chain_id: string;
  nonce: string;
  issued_at: bigint;
  expiration_time: bigint;
}

export type PrepareLoginResponse = { Ok: SiwsMessage } | { Err: string };

export type PublicKey = Uint8Array | number[];

export type SessionKey = PublicKey;

export interface SignedDelegation {
  signature: Uint8Array | number[];
  delegation: Delegation;
}

export type SiwsSignature = string;

export type Timestamp = bigint;

export type Nonce = string;

export interface SIWS_IDENTITY_SERVICE {
  siws_prepare_login: ActorMethod<[Address], PrepareLoginResponse>;
  siws_login: ActorMethod<
    [SiwsSignature, Address, SessionKey, Nonce],
    LoginResponse
  >;
  siws_get_delegation: ActorMethod<
    [Address, SessionKey, Timestamp],
    GetDelegationResponse
  >;
}
