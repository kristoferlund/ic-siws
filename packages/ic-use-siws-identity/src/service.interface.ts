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
  user_canister_pubkey: CanisterPublicKey;
  expiration: Timestamp;
}

export type LoginResponse = { Ok: LoginOkResponse } | { Err: string };

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

export type SiweSignature = string;

export type Timestamp = bigint;

export interface SIWE_IDENTITY_SERVICE {
  siwe_prepare_login: ActorMethod<[Address], PrepareLoginResponse>;
  siwe_login: ActorMethod<[SiweSignature, Address, SessionKey], LoginResponse>;
  siwe_get_delegation: ActorMethod<
    [Address, SessionKey, Timestamp],
    GetDelegationResponse
  >;
}
