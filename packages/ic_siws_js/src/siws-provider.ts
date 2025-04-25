import {
  HttpAgent,
  type ActorConfig,
  type HttpAgentOptions,
  Actor,
  type DerEncodedPublicKey,
  type ActorSubclass,
} from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";
import type { SIWS_IDENTITY_SERVICE } from "./service.interface";
import type { PublicKey } from "@solana/web3.js";

/**
 * Creates an anonymous actor for interactions with the Internet Computer.
 * This is used primarily for the initial authentication process.
 */
export async function createAnonymousActor({
  idlFactory,
  canisterId,
  httpAgentOptions,
  actorOptions,
}: {
  idlFactory: IDL.InterfaceFactory;
  canisterId: string;
  httpAgentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
}) {
  const shouldFetchRootKey = process.env.DFX_NETWORK !== "ic";
  const agent = await HttpAgent.create({
    ...httpAgentOptions,
    shouldFetchRootKey,
  });
  return Actor.createActor<SIWS_IDENTITY_SERVICE>(idlFactory, {
    agent,
    canisterId,
    ...actorOptions,
  });
}

export async function callPrepareLogin(
  anonymousActor: ActorSubclass<SIWS_IDENTITY_SERVICE>,
  publicKey: PublicKey,
) {
  if (!anonymousActor || !publicKey) {
    throw new Error("Invalid actor or public key");
  }

  const response = await anonymousActor.siws_prepare_login(
    publicKey.toBase58(),
  );

  if ("Err" in response) {
    throw new Error(response.Err);
  }

  return response.Ok;
}

/**
 * Logs in the user by sending a signed SIWS message to the backend.
 */
export async function callLogin(
  anonymousActor: ActorSubclass<SIWS_IDENTITY_SERVICE>,
  signature: string,
  publicKey: PublicKey,
  sessionPublicKey: DerEncodedPublicKey,
  nonce: string,
) {
  if (!anonymousActor || !signature || !publicKey) {
    throw new Error("Invalid actor, data or address");
  }

  const loginReponse = await anonymousActor.siws_login(
    signature,
    publicKey.toBase58(),
    new Uint8Array(sessionPublicKey),
    nonce,
  );

  if ("Err" in loginReponse) {
    throw new Error(loginReponse.Err);
  }

  return loginReponse.Ok;
}

/**
 * Retrieves a delegation from the backend for the current session.
 */
export async function callGetDelegation(
  anonymousActor: ActorSubclass<SIWS_IDENTITY_SERVICE>,
  publicKey: PublicKey,
  sessionPublicKey: DerEncodedPublicKey,
  expiration: bigint,
) {
  if (!anonymousActor || !publicKey) {
    throw new Error("Invalid actor or address");
  }

  const response = await anonymousActor.siws_get_delegation(
    publicKey.toBase58(),
    new Uint8Array(sessionPublicKey),
    expiration,
  );

  if ("Err" in response) {
    throw new Error(response.Err);
  }

  return response.Ok;
}
