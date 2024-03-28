import {
  HttpAgent,
  type ActorConfig,
  type HttpAgentOptions,
  Actor,
  type DerEncodedPublicKey,
  type ActorSubclass,
} from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";
import type { SIWE_IDENTITY_SERVICE } from "./service.interface";
import type { PublicKey } from "@solana/web3.js";

/**
 * Creates an anonymous actor for interactions with the Internet Computer.
 * This is used primarily for the initial authentication process.
 */
export function createAnonymousActor({
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
  if (!idlFactory || !canisterId) return;
  const agent = new HttpAgent({ ...httpAgentOptions });

  if (process.env.DFX_NETWORK !== "ic") {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running"
      );
      console.error(err);
    });
  }

  return Actor.createActor<SIWE_IDENTITY_SERVICE>(idlFactory, {
    agent,
    canisterId,
    ...actorOptions,
  });
}

export async function callPrepareLogin(
  anonymousActor: ActorSubclass<SIWE_IDENTITY_SERVICE>,
  publicKey: PublicKey
) {
  if (!anonymousActor || !publicKey) {
    throw new Error("Invalid actor or public key");
  }

  const response = await anonymousActor.siwe_prepare_login(
    publicKey.toBase58()
  );

  if ("Err" in response) {
    throw new Error(response.Err);
  }

  return response.Ok;
}

/**
 * Logs in the user by sending a signed SIWE message to the backend.
 */
export async function callLogin(
  anonymousActor: ActorSubclass<SIWE_IDENTITY_SERVICE>,
  signature: string,
  publicKey: PublicKey,
  sessionPublicKey: DerEncodedPublicKey
) {
  if (!anonymousActor || !signature || !publicKey) {
    throw new Error("Invalid actor, data or address");
  }

  const loginReponse = await anonymousActor.siwe_login(
    signature,
    publicKey.toBase58(),
    new Uint8Array(sessionPublicKey)
  );

  console.log("loginReponse", loginReponse);

  if ("Err" in loginReponse) {
    throw new Error(loginReponse.Err);
  }

  return loginReponse.Ok;
}

/**
 * Retrieves a delegation from the backend for the current session.
 */
export async function callGetDelegation(
  anonymousActor: ActorSubclass<SIWE_IDENTITY_SERVICE>,
  publicKey: PublicKey,
  sessionPublicKey: DerEncodedPublicKey,
  expiration: bigint
) {
  if (!anonymousActor || !publicKey) {
    throw new Error("Invalid actor or address");
  }

  const response = await anonymousActor.siwe_get_delegation(
    publicKey.toBase58(),
    new Uint8Array(sessionPublicKey),
    expiration
  );

  if ("Err" in response) {
    throw new Error(response.Err);
  }

  return response.Ok;
}
