import {
  DelegationChain,
  DelegationIdentity,
  Ed25519KeyIdentity,
} from "@dfinity/identity";

import { PublicKey } from "@solana/web3.js";
import type { SiwsIdentityStorage } from "./storage.type";

const STORAGE_KEY = "siwsIdentity";

/**
 * Loads the SIWS identity from local storage.
 */
export function loadIdentity() {
  const storedState = localStorage.getItem(STORAGE_KEY);

  if (!storedState) {
    throw new Error("No stored identity found.");
  }

  const s: SiwsIdentityStorage = JSON.parse(storedState);
  if (!s.publicKey || !s.sessionIdentity || !s.delegationChain) {
    throw new Error("Stored state is invalid.");
  }

  const p = new PublicKey(s.publicKey);
  const d = DelegationChain.fromJSON(JSON.stringify(s.delegationChain));
  const i = DelegationIdentity.fromDelegation(
    Ed25519KeyIdentity.fromJSON(JSON.stringify(s.sessionIdentity)),
    d
  );

  return [p, i, d] as const;
}

/**
 * Saves the SIWS identity to local storage.
 */
export function saveIdentity(
  publicKey: PublicKey,
  sessionIdentity: Ed25519KeyIdentity,
  delegationChain: DelegationChain
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      publicKey: publicKey.toBase58(),
      sessionIdentity: sessionIdentity.toJSON(),
      delegationChain: delegationChain.toJSON(),
    })
  );
}

/**
 * Clears the SIWS identity from local storage.
 */
export function clearIdentity() {
  localStorage.removeItem(STORAGE_KEY);
}
