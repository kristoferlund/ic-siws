![Sign in with Solana for the Internet Computer](/media/header.png)

`ic-use-siws-identity` is a React hook and context provider for easy frontend integration with SIWS enabled [Internet Computer](https://internetcomputer.org) canisters.

`ic-use-siws-identity` is part of the [ic-siws](https://github.com/kristoferlund/ic-siws) project that enables Solana wallet-based authentication for applications on the Internet Computer (ICP) platform. The goal of the project is to enhance the interoperability between Solana and the Internet Computer platform, enabling developers to build applications that leverage the strengths of both platforms.

A SIWS enabled canister is a canister that integrates the [ic_siws](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws) library and exposes the [SIWS login interface](src/service.interface.ts). The `ic_siws` library provides a set of functions for managing Internet Computer delegate identities created using Solana signatures.

[![version][version-image]][npm-link]
[![downloads][dl-image]][npm-link]

## Features

- **Cached Identity**: The identity is cached in local storage and restored on page load. This allows the user to stay logged in even if the page is refreshed.
- **Login progress**: State varibles are provided to indicate whether the user is logged in, logging in, or logged out.
- **Works with ic-use-actor**: Plays nicely with [ic-use-actor](https://www.npmjs.com/package/ic-use-actor) for hassle free frontend integration.
- **Works with ic_siws_provider**: An easy alternative to integrating with `ic_siws` directly is using the prebuilt [ic_siws_provider](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws_provider) canister. The provider canister can be added to your project as a dependency and used as a login provider for you project.

## Table of Contents

- [Features](#features)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Usage](#usage)
  - [1. Add an Solana wallet provider](#1-add-an-ethereum-wallet-provider)
  - [2. Setup the `SiwsIdentityProvider` component](#2-setup-the-siwsidentityprovider-component)
  - [3. Prepare the login](#3-prepare-the-login)
  - [4. Initiate the login process](#4-initiate-the-login-process)
- [SiwsIdentityProvider props](#siweidentityprovider-props)
- [useSiwsIdentity interface](#usesiweidentity-interface)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

## Installation

In addition to `ic-use-siws-identity`, these peer dependencies are required:

- `@dfinity/agent`
- `@dfinity/candid`
- `@dfinity/identity`
- `@solana/wallet-adapter-base`
- `@solana/wallet-adapter-react`

```bash
npm install ic-use-siws-identity @dfinity/agent @dfinity/candid @dfinity/identity @solana/wallet-adapter-base @solana/wallet-adapter-react
```

## Usage

> [!TIP]
> For a complete example, see the [ic-siws-react-demo-rust](https://github.com/kristoferlund/ic-siws-react-demo-rust) demo project.

To use `ic-use-siws-identity` in your React application, follow these steps:

### 1. Add an Solana wallet provider

Before interacting with the useSiwsIdentity hook, you need to add an Solana wallet provider to your application. The wallet provider is responsible for connecting to the Solana wallet and handling the signing of messages. It an detect most Solana wallets on the market.


> [!TIP]
> See the [Solana wallet adapter documentation](https://github.com/anza-xyz/wallet-adapter#readme) for the most up-to-date setup instructions.

```jsx
// SolanaProviders.tsx

import "@solana/wallet-adapter-react-ui/styles.css";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import React, { useMemo } from "react";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

export default function SolanaProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect wallets={[]}>
        <WalletModalProvider>{children}</WalletModalProvider> // The rest of your app
      </WalletProvider>
    </ConnectionProvider>
  );
}

```

### 2. Setup the `SiwsIdentityProvider` component

Wrap your application's root component with `SiwsIdentityProvider` to provide all child components access to the SIWS identity context. Provide the component with the `_SERVICE` type argument, where `_SERVICE` represents the canister service definition of a canister that implements the [SIWS login interface](src/service.interface.ts). This could be a canister that you have created yourself, using the [ic_siws](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws) library, or the prebuilt [ic_siws_provider](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws_provider) canister. Adding the pre-built provider canister to your project as a dependency is the easiest way to get started.

```jsx
// App.tsx

import { SiwsIdentityProvider } from 'ic-use-siws-identity';
import { _SERVICE } from "[DECLARATIONS PATH]/declarations/ic_siws_provider/ic_siws_provider.did";
import {
  canisterId,
  idlFactory,
} from "[DECLARATIONS PATH]/declarations/ic_siws_provider/index";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SolanaProviders>
      <SiwsIdentityProvider<_SERVICE>
        canisterId={canisterId}
        idlFactory={idlFactory}
      >
        <Actors>
          <AuthGuard>
            <App />
          </AuthGuard>
        </Actors>
      </SiwsIdentityProvider>
    </SolanaProviders>
  </React.StrictMode>
);

```

### 3. Prepare the login

This is an optional step, as the login process will automatically call `prepareLogin` if it has not been called manually. However, calling `prepareLogin` before initiating the login process improves the user experience by reducing the time it takes to complete the login. The `prepareLogin` function requests a SIWS message from the backend. This is an update call that usually takes two to three seconds to complete.

The `prepareLoginStatus` state variable can be used to indicate the status of the prepare login process. Errors that occur during the prepare login process are stored in the `prepareLoginError` state variable.

> [!IMPORTANT]
> Be sure to call `prepareLogin` again on wallet change, as the SIWS message is unique to the Solana address of the user. If the user changes their wallet, the SIWS message will be invalid and a new one must be requested.

```jsx
  const { publicKey } = useWallet(); // Solana wallet hook
  const { prepareLogin, isPrepareLoginIdle, prepareLoginError, loginError } =
    useSiwsIdentity();

/**
 * Preload a Siws message on every address change.
 */
  useEffect(() => {
    if (!isPrepareLoginIdle || !publicKey) return;
    prepareLogin();
  }, [publicKey, prepareLogin, isPrepareLoginIdle]);
```

### 4. Initiate the login process

The login process is initiated by calling the `login` function. This function requests a SIWS message from the backend if it has not already been loaded. The user is asked to sign the message using their Solana wallet and the signed message is sent to the backend for authentication. Once the authentication is complete, the user's identity is stored in local storage and the `identity` state variable is updated with the new identity.

The `loginStatus` state variable can be used to indicate the status of the login process. Errors that occur during the login process are stored in the `loginError` state variable.

```jsx
import { useSiwsIdentity } from "ic-use-siws-identity";
import { useWallet } from "@solana/wallet-adapter-react";

export default function LoginButton() {
  const { connected } = useWallet();
  const { login, isLoggingIn, isPreparingLogin } = useSiwsIdentity();

  const text = () => {
    if (isLoggingIn) {
      return "Signing in";
    }
    if (isPreparingLogin) {
      return "Preparing";
    }
    return "Sign in";
  };

  const disabled = isLoggingIn || !connected || isPreparingLogin;

  return (
    <button
      disabled={disabled}
      onClick={() => {
        login();
      }}
    >
      {text()}
    </button>
  );
}
```

## SiwsIdentityProvider props

```ts
{
  /** Configuration options for the HTTP agent used to communicate with the Internet Computer network. */
  httpAgentOptions?: HttpAgentOptions;

  /** Configuration options for the actor. These options are passed to the actor upon its creation. */
  actorOptions?: ActorConfig;

  /** The Interface Description Language (IDL) factory for the canister. This factory is used to create an actor interface for the canister. */
  idlFactory: IDL.InterfaceFactory;

  /** The unique identifier of the canister on the Internet Computer network. This ID is used to establish a connection to the canister. */
  canisterId: string;

  /** The child components that the SiwsIdentityProvider will wrap. This allows any child component to access the authentication context provided by the SiwsIdentityProvider. */
  children: ReactNode;
}
```

## useSiwsIdentity interface

```ts
export type SiwsIdentityContextType = {
  /** Is set to `true` on mount until a stored identity is loaded from local storage or
   * none is found. */
  isInitializing: boolean;

  /** Load a SIWS message from the provider canister, to be used for login. Calling prepareLogin
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

  /** Initiates the login process by requesting a SIWS message from the backend. */
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

  /** The delegation chain is available after successfully loading the identity from local
   * storage or completing the login process. */
  delegationChain?: DelegationChain;

  /** The identity is available after successfully loading the identity from local storage
   * or completing the login process. */
  identity?: DelegationIdentity;

  /** The Ethereum address associated with current identity. This address is not necessarily
   * the same as the address of the currently connected wallet - on wallet change, the addresses
   * will differ. */
  identityAddress?: PublicKey;

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

[version-image]: https://img.shields.io/npm/v/ic-use-siws-identity
[dl-image]: https://img.shields.io/npm/dw/ic-use-siws-identity
[npm-link]: https://www.npmjs.com/package/ic-use-siws-identity
