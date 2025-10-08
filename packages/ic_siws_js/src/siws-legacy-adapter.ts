import type { WalletAdapter } from '@solana/wallet-adapter-base';
import bs58 from 'bs58';

const SIWS_PATCHED = Symbol('siwsPatched');
const SIWS_NETWORK = Symbol('siwsNetwork');

interface SiwsSignInInput {
  domain?: string;
  address?: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: string;
  nonce?: string;
  issuedAt?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

interface SiwsSignInOutput {
  account: {
    address: string;
    publicKey: Uint8Array;
  };
  signedMessage: string;
  signature: Uint8Array;
}

interface SiwsMessageParams {
  domain: string;
  address: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

// Extended wallet adapter interface with signIn method
interface ExtendedWalletAdapter extends WalletAdapter {
  signIn?: (input?: SiwsSignInInput) => Promise<SiwsSignInOutput>;
  [SIWS_PATCHED]?: boolean;
  [SIWS_NETWORK]?: string;
}

export class SiwsLegacyWalletAdapter {
  /**
   * Patch a legacy wallet adapter to support SIWS signIn
   * This adds the signIn method using signMessage under the hood
   */
  static patchWalletAdapter(adapter: WalletAdapter, network: string = 'devnet'): WalletAdapter {
      const extendedAdapter = adapter as ExtendedWalletAdapter;

      // If adapter has a native signIn (not patched by us), do not touch it
      const hasSignIn = typeof extendedAdapter.signIn === 'function';
      const isPatched = !!extendedAdapter[SIWS_PATCHED];

      if (hasSignIn && !isPatched) {
        console.log(`${adapter.name} already has native signIn; leaving as-is`);
        return adapter;
      }

      // If already patched and network matches, nothing to do
      if (isPatched && extendedAdapter[SIWS_NETWORK] === network) {
        return adapter;
      }

      // If doesn't have signMessage, can't patch
      if (typeof adapter.signMessage !== 'function') {
        console.warn(`${adapter.name} doesn't support signMessage, cannot patch`);
        return adapter;
      }

      console.log(
        isPatched
          ? `Re-patching ${adapter.name} to update SIWS network → ${network}`
          : `Patching ${adapter.name} to add SIWS signIn support (network: ${network})`
      );

      // Add signIn method
      extendedAdapter.signIn = async (input?: SiwsSignInInput): Promise<SiwsSignInOutput> => {
        if (!adapter.publicKey) {
          throw new Error('Wallet not connected');
        }

        const params: SiwsMessageParams = {
          domain: input?.domain || window.location.host,
          address: adapter.publicKey.toBase58(),
          statement: input?.statement || 'Sign in with Solana to DecideID',
          uri: input?.uri || window.location.origin,
          version: input?.version || '1',
          chainId: input?.chainId || network,
          nonce: input?.nonce || SiwsLegacyWalletAdapter.generateNonce(),
          issuedAt: input?.issuedAt || new Date().toISOString(),
          expirationTime: input?.expirationTime,
          notBefore: input?.notBefore,
          requestId: input?.requestId,
          resources: input?.resources,
        };

        const message = SiwsLegacyWalletAdapter.constructSiwsMessage(params);
        const messageBytes = new TextEncoder().encode(message);

        const signature = await adapter.signMessage!(messageBytes);

        return {
          account: {
            address: adapter.publicKey.toBase58(),
            publicKey: adapter.publicKey.toBytes(),
          },
          signedMessage: message,
          signature: signature,
        };
      };

      // Mark as patched and record the active network
      extendedAdapter[SIWS_PATCHED] = true;
      extendedAdapter[SIWS_NETWORK] = network;

      return extendedAdapter;
  }

  private static constructSiwsMessage(params: SiwsMessageParams): string {
    const header = `${params.domain} wants you to sign in with your Solana account:`;
    const addressLine = params.address;

    let message = `${header}\n${addressLine}`;

    if (params.statement) {
      message += `\n\n${params.statement}`;
    }

    const fields: string[] = [];

    if (params.uri) fields.push(`URI: ${params.uri}`);
    if (params.version) fields.push(`Version: ${params.version}`);
    if (params.chainId) fields.push(`Chain ID: ${params.chainId}`);
    if (params.nonce) fields.push(`Nonce: ${params.nonce}`);
    if (params.issuedAt) fields.push(`Issued At: ${params.issuedAt}`);
    if (params.expirationTime) fields.push(`Expiration Time: ${params.expirationTime}`);
    if (params.notBefore) fields.push(`Not Before: ${params.notBefore}`);
    if (params.requestId) fields.push(`Request ID: ${params.requestId}`);

    if (params.resources && params.resources.length > 0) {
      fields.push(`Resources:`);
      params.resources.forEach((resource: string) => {
        fields.push(`- ${resource}`);
      });
    }

    if (fields.length > 0) {
      message += `\n\n${fields.join('\n')}`;
    }

    return message;
  }

  private static generateNonce(): string {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return bs58.encode(randomBytes);
  }

  static shouldPatchWallet(walletName: string): boolean {
    // List of wallets that need patching
    const legacyWallets = ['Solflare', 'Glow'];
    return legacyWallets.includes(walletName);
  }
}