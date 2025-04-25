![Sign in with Solana for the Internet Computer](/media/header.png)

`ic-siws-js` is a JavaScript/TypeScript support library for easy frontend integration with SIWS-enabled [Internet Computer](https://internetcomputer.org) canisters. In addition to the core JS/TS API, `ic-siws-js` provides dedicated integrations for **React, Vue, and Svelte**.

This library is part of the [ic-siwe](https://github.com/kristoferlund/ic-siwe) project that enables Ethereum and Solana wallet-based authentication for applications on the Internet Computer (ICP) platform. The goal of the project is to enhance interoperability between blockchain wallets and the Internet Computer, enabling developers to build applications that leverage the strengths of both platforms.

A SIWS provider canister implements the SIWS identity service and exposes the SIWS login interface. The `ic-siws-js` library provides functions for managing Internet Computer delegate identities created via Solana signatures. The easiest way to integrate is to use this library together with the IC SIWS provider canister.


[![version][version-image]][npm-link]
[![downloads][dl-image]][npm-link]
  
## Introduction

`ic-siws-js` enables web applications to authenticate users via Solana wallets and the Sign-In with Solana (SIWS) protocol on the Internet Computer. It handles the end-to-end login flow: preparing a SIWS message, prompting the user to sign with their wallet, sending the signature to a SIWS provider canister for verification, and managing the resulting delegate identity.

## Architecture Overview

At the heart of the library is the `SiwsManager` class. It:
- Communicates with a SIWS provider canister using Candid actors.
- Uses a Solana wallet adapter (from `@solana/wallet-adapter-base`) to sign SIWS messages.
- Stores and restores delegate identities and delegation chains in local storage.
- Exposes a reactive state store (`siwsStateStore`) to track the login lifecycle and identity state.

Framework-specific wrappers (`SiwsIdentityProvider`, `useSiws` or Svelte stores) consume the manager and state store, offering a seamless developer experience.

## Features

- **Supports vanilla JS/TS**: The library can be used with plain JavaScript or TypeScript projects, including **Svelte** and **SolidJS**
- **Supports React, Vue, and Svelte**: The library provides components and hooks (or stores) for easy integration with React, Vue, and Svelte.
- **Cached Identity**: The identity is cached in local storage and restored on page load. This allows the user to stay logged in even if the page is refreshed.
- **Login progress**: State varibles are provided to indicate whether the user is logged in, logging in, or logged out.
- **Solana Wallet Adapter Integration**: Uses [@solana/wallet-adapter-base](https://github.com/solana-labs/wallet-adapter) for Solana wallet integration.
- **Works with ic-use-actor**: Plays nicely with [ic-use-actor](https://www.npmjs.com/package/ic-use-actor) for hassle free frontend integration.
- **Works with ic_siws_provider**: An easy alternative to integrating with `ic-siws` directly is using the prebuilt [ic_siws_provider](https://github.com/kristoferlund/ic-siwe/tree/main/packages/ic_siws_provider) canister. The provider canister can be added to your project as a dependency and used as a login provider for your project.

## Table of Contents

- [Installation & Prerequisites](#installation--prerequisites)
- [Quick Start (Vanilla JS/TS)](#usage)
- [Usage with React](#usage-with-react)
- [Usage with Vue](#usage-with-vue)
- [Usage with Svelte](#usage-with-svelte)
- [SiwsIdentityProvider props](#siwsidentityprovider-props)
- [useSiws interface](#usesiws-interface)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

## Installation & Prerequisites

In addition to `ic-siws-js`, these peer dependencies are required:

- `@solana/wallet-adapter-base`
- `@solana/web3.js`
- `@dfinity/agent`
- `@dfinity/candid`
- `@dfinity/identity`

```bash
npm install ic-siws-js @solana/wallet-adapter-base @solana/web3.js @dfinity/agent @dfinity/candid @dfinity/identity
```

## Usage

### Quick Start (Vanilla JS/TS)

> [!TIP]
> A complete Vanilla TS example can be found in the [ic-siws-vanilla-ts-demo](xxx) repository.

```ts
import { canisterId } from "../../ic_siws_provider/declarations/index";
import { SiwsManager, siwsStateStore } from "ic-siws-js";

// Initialize the SiwsManager with the canisterId of the SIWS provider canister.
const siws = new SiwsManager(canisterId);

// Set up HTML elements for login and logout buttons, etc.
// ...

// Interact with the SiwsManager instance to trigger the login process or to logout.
loginButton.addEventListener("click", () => siws.login());
logoutButton.addEventListener("click", () => siws.clear());

// Listen for changes to the siwsStateStore and update the UI accordingly.
siwsStateStore.subscribe((snapshot) => {
  const {
    prepareLoginStatus,
    prepareLoginError,
    loginStatus,
    loginError,
    signMessageStatus,
  } = snapshot.context;

  if (loginStatus === "idle") {
    loginButton.innerHTML = "Login";
    loginButton.disabled = false;
  }
  if (loginStatus === "logging-in") {
    loginButton.innerHTML = "Logging in...";
    loginButton.disabled = true;
  }

  // Handle other states ...
}
```

### Usage with React

> [!TIP]
> A complete React example can be found in the [ic-siws-react-demo](xxx) repository.

The React submodule comes with the `SiweIdentityProvider` component that makes the `SiweManager` available throughout the app. It also provides a `useSiwe` hook that can be used to interact with the `SiweManager` instance.

### 1. Setup the `SiweIdentityProvider` component

Wrap your application's root component with `SiweIdentityProvider` to provide all child components access to the SIWE identity context. Provide the component with the canister id of the SIWE provider canister.

```jsx
// App.tsx

import { SiwsIdentityProvider } from 'ic-siws-js/react';
import { canisterId } from "../../ic_siws_provider/declarations/index";
import type { SignInMessageSignerWalletAdapter } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';

function App() {
  const wallet = useWallet() as SignInMessageSignerWalletAdapter;
  return (
    <SiwsIdentityProvider canisterId={canisterId} adapter={wallet}>
      {/* ...your app components */}
    </SiwsIdentityProvider>
  );
}
```

### 2. Initiate the login process

The login process is initiated by calling the `login` function. This function requests a SIWS message from the backend if it has not already been loaded. The user is asked to sign the message using their Solana wallet and the signed message is sent to the backend for authentication. Once the authentication is complete, the user's identity is stored in local storage and the `identity` state variable is updated with the new identity.

The `loginStatus` state variable can be used to indicate the status of the login process. Errors that occur during the login process are stored in the `loginError` state variable.

```jsx
import { useSiws } from 'ic-siws-js/react';
const { login, loginStatus, prepareLoginStatus } = useSiws();

return (
  <button disabled={loginStatus === 'logging-in'} onClick={login}>
    {loginStatus === 'logging-in' ? 'Signing in…' : 'Sign in'}
  </button>
);
```

### Usage with Vue

> [!TIP]
> A complete Vue example can be found in the [ic-siws-vue-demo](xxx) repository.

The Vue submodule comes with `SiwsIdentityProvider` that makes the `SiwsManager` available to all components in the app. It also provides a `useSiws` hook to access the SIWS identity context.

#### 1. Initialize the SIWS provider context

In your root `App.vue`, call `createSiwsIdentityProvider` inside the `<script setup>` to configure the SIWS context with your canister ID and optional Solana adapter.

```html
<script setup lang="ts">
import { ref, watch } from "vue";
import { createSiwsIdentityProvider, useSiws } from "ic-siws-js/vue";
import { canisterId } from "../../ic_siws_provider/declarations/index";
import { useWallet } from "solana-wallets-vue";
import type { Adapter } from "@solana/wallet-adapter-base";

// Wallet adapter may be undefined until the user connects
const { wallet } = useWallet();
const adapterRef = ref<Adapter | undefined>(wallet.value?.adapter);

// Initialize SIWS context with canister and optional adapter
createSiwsIdentityProvider({
  canisterId,
  adapter: adapterRef.value,
});

// Update adapter and clear identity on wallet connect/disconnect
const siws = useSiws();
watch(wallet, ({ adapter }) => {
  if (adapter) {
    siws.setAdapter(adapter);
  } else {
    siws.clear();
  }
});
</script>

<template>
  <!-- Your app components -->
</template>
```

```html
<script setup lang="ts">
import { computed, watch } from "vue";
import { useSiws } from "ic-siws-js/vue";
import { WalletMultiButton } from "solana-wallets-vue";
import { useWallet } from "solana-wallets-vue";

const siws = useSiws();
const { publicKey, wallet } = useWallet();

// Update SIWS adapter when wallet connects; clear identity on disconnect
watch(publicKey, () => {
  const adapter = wallet.value?.adapter;
  if (adapter) {
    siws.setAdapter(adapter);
  } else { 
    siws.clear();
  }
});

</script>

<template>
  <button
    v-if="publicKey && !siws.identity"
    @click="siws.login"
    :disabled="isLoginButtonDisabled"
    id="loginButton"
  >
    {{ loginButtonText }}
  </button>
</template>
```

### Usage with Svelte

> [!TIP]
> A complete React example can be found in the [ic-siws-svelte-demo](xxx) repository.


#### 1. Initialize the SIWS manager

Call `init` from `ic-siws-js/svelte` in your top-level component (`App.svelte`) to configure the SIWS manager with your canister ID and optional adapter.

```svelte
<script lang="ts">
  import { init as initSiws } from 'ic-siws-js/svelte';
  import { canisterId } from '../../ic_siws_provider/declarations/index';
  import { adapterStore } from './stores';

  // Initialize SIWS with canister ID; pass adapter if available
  initSiws(canisterId, $adapterStore);
</script>

<!-- Your app markup -->
```


SigninButton.svelte
#### 2. Use the SIWS store
```svelte
<script lang="ts">
  import { siws } from 'ic-siws-js/svelte';

  const { login, clear, isPreparingLogin, isLoggingIn, signMessageStatus, identity } = $siws;
</script>

{#if identity == null}

    {#if !identity}
    <button
      id="loginButton"
      on:click={login}
      disabled={isPreparingLogin || isLoggingIn || signMessageStatus === 'pending'}
    >
      {#if isPreparingLogin}
        Preparing…
      {:else if isLoggingIn}
        Logging in…
      {:else if signMessageStatus === 'pending'}
        Signing…
      {:else}
        Login
      {/if}
    </button>

  {/if}

  {#if identity}
    <button
      id="logoutButton"
    on:click={clear}
    >
      Logout
    </button>
  {/if}
{/if}
```
```


## API Reference

### SiwsIdentityProvider props

The `SiwsIdentityProvider` component (for React and Vue) or `SiwsIdentityProvider.svelte` component (for Svelte) accepts the following options:

- `canisterId: string` — The unique identifier of the SIWS provider canister on the Internet Computer network.
- `adapter?: SignInMessageSignerWalletAdapter` — Optional Solana wallet adapter from `@solana/wallet-adapter-base`.
- `httpAgentOptions?: HttpAgentOptions` — Optional HTTP agent configuration for Internet Computer communication.
- `actorOptions?: ActorConfig` — Optional actor configuration options.
- `children: ReactNode` — (React only) Child components to wrap. In Svelte and Vue, use the default slot or provided hook respectively.

### useSiws interface

```ts
export type PrepareLoginStatus = "error" | "preparing" | "success" | "idle";
export type LoginStatus = "error" | "logging-in" | "success" | "idle";
export type SignMessageStatus = "error" | "idle" | "pending" | "success";

export type SiwsIdentityContextType = {
  /** Is set to `true` on mount until a stored identity is loaded from local storage or
   * none is found. */
  isInitializing: boolean;

  /** Load a SIWE message from the provider canister, to be used for login. Calling prepareLogin
   * is optional, as it will be called automatically on login if not called manually. */
  prepareLogin: () => void;

  /** Reflects the current status of the prepareLogin process. */
  prepareLoginStatus: PrepareLoginStatus;

  /** `prepareLoginStatus === "loading"` */
  isPreparingLogin: boolean;

  /** `prepareLoginStatus === "error"` */
  isPrepareLoginError: boolean;

  /** `prepareLoginStatus === "success"` */
  isPrepareLoginSuccess: boolean;

  /** `prepareLoginStatus === "idle"` */
  isPrepareLoginIdle: boolean;

  /** Error that occurred during the prepareLogin process. */
  prepareLoginError?: Error;

  /** Initiates the login process by requesting a SIWE message from the backend. */
  login: () => Promise<DelegationIdentity | undefined>;

  /** Reflects the current status of the login process. */
  loginStatus: LoginStatus;

  /** `loginStatus === "logging-in"` */
  isLoggingIn: boolean;

  /** `loginStatus === "error"` */
  isLoginError: boolean;

  /** `loginStatus === "success"` */
  isLoginSuccess: boolean;

  /** `loginStatus === "idle"` */
  isLoginIdle: boolean;

  /** Error that occurred during the login process. */
  loginError?: Error;

  /** Status of the SIWE message signing process. */
  signMessageStatus: SignMessageStatus;

  /** Error that occurred during the SIWE message signing process. */
  signMessageError?: Error;

  /** The delegation chain is available after successfully loading the identity from local
   * storage or completing the login process. */
  delegationChain?: DelegationChain;

  /** The identity is available after successfully loading the identity from local storage
   * or completing the login process. */
  identity?: DelegationIdentity;

  /** The Ethereum address associated with current identity. This address is not necessarily
   * the same as the address of the currently connected wallet - on wallet change, the addresses
   * will differ. */
  identityAddress?: string;

  /** Sets or changes the Solana wallet adapter at runtime. Must be called before login if the adapter was not provided initially. */
  setAdapter: (adapter: Adapter) => Promise<void>;
  
  /** Clears the identity from the state and local storage. Effectively "logs the user out". */
  clear: () => void;
};
```

## Contributing

Contributions are welcome. Please submit your pull requests or open issues to propose changes or report bugs.

## Author

- [kristofer@fmckl.se](mailto:kristofer@fmckl.se)
- Twitter: [@kristoferlund](https://twitter.com/kristoferlund)
- Discord: kristoferkristofer
- Telegram: [@kristoferkristofer](https://t.me/kristoferkristofer)

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

[version-image]: https://img.shields.io/npm/v/ic-siws-js
[dl-image]: https://img.shields.io/npm/dw/ic-siws-js
[npm-link]: https://www.npmjs.com/package/ic-siws-js
