![Sign in with Solana for the Internet Computer](/media/header.png)

`ic-siws` is a project that enables Solana wallet-based authentication for applications on ICP, [The Internet Computer](https://internetcomputer.org). The goal of the project is to enhance the interoperability between Solana and the Internet Computer platform, enabling developers to build applications that leverage the strengths of both platforms.

## Also available

[ic-siwe](https://github.com/kristoferlund/ic-siwe) - The sibling project of `ic-siws`, `ic-siwe` offers the same functionality
for Ethereum-based applications.

## Features

- **Solana Wallet Sign-In**: Enables Solana wallet sign-in for IC applications. Sign in with any sol wallet to generate an IC identity and session.

- **Session Identity Uniqueness**: Ensures that session identities are specific to each application's context, preventing cross-app identity misuse.

- **Consistent Principal Generation**: Guarantees that logging in with an Solana wallet consistently produces the same Principal, irrespective of the client used.

- **Direct Solana Address to Principal Mapping**: Creates a one-to-one correlation between Solana addresses and Principals within the scope of the current application.

- **Timebound Sessions**: Allows developers to set expiration times for sessions, enhancing security and control.

- **Prebuilt Identity Provider**: Provides a prebuilt canister that can be integrated into any Internet Computer application, independent of the application's programming language.


## How it works

`ic-siws` integrates Solana wallet authentication into IC applications via a SIWS‑enabled canister and the `ic-siws-js` frontend support library:

1. Frontend uses `ic-siws-js` to request a SIWS login message from the canister.  
2. The canister generates and returns the SIWS message.  
3. `ic-siws-js` prompts the user to sign the message with their Solana wallet.  
4. The signed message is sent back through `ic-siws-js` to the canister.  
5. The canister verifies the signature and issues a delegated IC identity (Principal).  
6. The frontend uses the delegated identity for authenticated calls to other canisters.


![Sign in with Solana - Login flow](/media/flow.png)

## Packages

`ic-siws` provides three packages to enable Sign‑In with Solana in your Internet Computer application:

### 1. [ic_siws](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws) (Rust library)
A SIWS‑enabled canister implements the interface to:
- Generate SIWS login messages  
- Verify Solana wallet signatures  
- Issue delegated IC identities (Principals)  

Integrate the `ic_siws` library directly into your canister project for full control over the SIWS flow and customization.

### 2. [ic-siws-provider](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws_provider) (Prebuilt canister)
A ready‑to‑use SIWS‑enabled canister implementing the above interface out of the box.   To use:
1. Add `ic_siws_provider` to your `dfx.json`.  
2. Configure it to your application’s needs.  

This is the easiest way to get SIWS up and running in any IC app.

### 3. [ic-siws-js](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws_js) (JavaScript/TypeScript library)
Frontend support library for interacting with SIWS‑enabled canisters.  
Supports vanilla JS/TS as well as Vue, React, and Svelte integrations.

## Demo apps

There are several demo applications available that showcase the integration of the `ic_siws_provider` canister with different frontend frameworks. These demos provide a practical example of how to use the canister to implement Solana wallet authentication in your ICP application.

* React: [ic-siws-react-demo](https://github.com/kristoferlund/ic-siws-react-demo)
* Vue: [ic-siws-vue-demo](https://github.com/kristoferlund/ic-siws-vue-demo)
* Svelte: [ic-siws-svelte-demo](https://github.com/kristoferlund/ic-siws-svelte-demo)
* Vanilla TS: [ic-siws-vanilla-ts-demo](https://github.com/kristoferlund/ic-siws-vanilla-ts-demo)


## Updates

See the respective package CHANGELOG for details on updates.

## Contributing

Contributions are welcome. Please submit your pull requests or open issues to propose changes or report bugs.

## Author

- [kristofer@kristoferlund.se](mailto:kristofer@kristoferlund.se)
- Twitter: [@kristoferlund](https://twitter.com/kristoferlund)
- Discord: kristoferkristofer
- Telegram: [@kristoferkristofer](https://t.me/kristoferkristofer)

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
