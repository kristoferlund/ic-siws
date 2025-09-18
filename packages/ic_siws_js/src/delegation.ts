import type { DerEncodedPublicKey, Signature } from "@dfinity/agent";
import type { PublicKey } from "./service.interface";
import { Principal } from "@dfinity/principal";
import { Delegation } from "@dfinity/identity";
import { DelegationChain, type SignedDelegation } from "@dfinity/identity";
import type { SignedDelegation as ServiceSignedDelegation } from "./service.interface";

/**
 * Converts a Uint8Array or number array to a Signature object.
 */
export function asSignature(signature: Uint8Array | number[]): Signature {
  const uint8Array = signature instanceof Uint8Array
    ? signature
    : new Uint8Array(signature);
  return uint8Array as unknown as Signature;
}

/**
 * Converts a Uint8Array or number array to a DerEncodedPublicKey object.
 */
export function asDerEncodedPublicKey(
  publicKey: Uint8Array | number[]
): DerEncodedPublicKey {
  const uint8Array = publicKey instanceof Uint8Array
    ? publicKey
    : new Uint8Array(publicKey);
  return uint8Array.buffer as unknown as DerEncodedPublicKey;
}

export function createDelegationChain(
  signedDelegation: ServiceSignedDelegation,
  publicKey: PublicKey
) {
  const publicKeyUint8Array = publicKey instanceof Uint8Array
    ? publicKey
    : new Uint8Array(publicKey);

  const pubkeyUint8Array = signedDelegation.delegation.pubkey instanceof Uint8Array
    ? signedDelegation.delegation.pubkey
    : new Uint8Array(signedDelegation.delegation.pubkey);

  const delegations: SignedDelegation[] = [
    {
      delegation: new Delegation(
        pubkeyUint8Array,
        signedDelegation.delegation.expiration,
        signedDelegation.delegation.targets[0] as Principal[]
      ),
      signature: asSignature(signedDelegation.signature),
    },
  ];
  return DelegationChain.fromDelegations(
    delegations,
    asDerEncodedPublicKey(pubkeyUint8Array)
  );
}
