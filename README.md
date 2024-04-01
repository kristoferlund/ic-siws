
![Sign in with Solana for the Internet Computer](/media/header.png)

`ic-siws` is a project that enables Solana wallet-based authentication for applications on the [Internet Computer](https://internetcomputer.org) (IC) platform. The goal of the project is to enhance the interoperability between Solana and the Internet Computer platform, enabling developers to build applications that leverage the strengths of both platforms.

## Also available

[ic-siwe](https://github.com/kristoferlund/ic-siws) - The sibling project of `ic-siws`, `ic-siwe` offers the same functionality
for Ethereum-based applications.

## Features

- **Solana Wallet Sign-In**: Enables Solana wallet sign-in for IC applications. Sign in with any sol wallet to generate an IC identity and session.

- **Session Identity Uniqueness**: Ensures that session identities are specific to each application's context, preventing cross-app identity misuse.

- **Consistent Principal Generation**: Guarantees that logging in with an Solana wallet consistently produces the same Principal, irrespective of the client used.

- **Direct Solana Address to Principal Mapping**: Creates a one-to-one correlation between Solana addresses and Principals within the scope of the current application.

- **Timebound Sessions**: Allows developers to set expiration times for sessions, enhancing security and control.

- **Prebuilt Identity Provider**: Provides a prebuilt canister that can be integrated into any Internet Computer application, independent of the application's programming language.

## Usage

Developers have two options to use SIWS in their IC applications:

1. **Use the prebuilt [ic_siws_provider](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws_provider) canister**: This is the easiest way to integrate SIWS into an Internet Computer application. The pre-built canister is added to the project `dfx.json` and then configured to meet the needs of the application. `ic_siws_provider` can be added to any Internet Computer application, independent of the application's programming language.

2. **Use the [ic_siws](https://crates.io/crates/ic_siws) library**: This allows developers full control over the SIWS integration. The `ic_siws` Rust library provides all the necessary tools for integrating SIWS into IC canisters.

### SIWS login flow

The below diagram illustrates the high-level login flow when using the `ic_siws_provider` canister.

1. An ICP application requests a SIWS message from the `ic_siws_provider` canister on behalf of the user.

2. The application displays the SIWS message to the user who signs it with their Solana wallet.

3. The application sends the signed SIWS message to the `ic_siws_provider` canister to login the user. The canister verifies the signature and creates an identity for the user.

4. The application retrieves the identity from the `ic_siws_provider` canister.

5. The application can now use the identity to make authenticated calls to canisters.

![Sign in with Solana - Login flow](/media/flow.png)

## Resources

`ic-siws` consists of two main packages: the Rust support library and the prebuilt identity provider canister. The project also includes React demo applications and React hooks for easy frontend integration with SIWS enabled Internet Computer canisters.

### [ic_siws](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws)

Rust library that provides the necessary tools for integrating Sign-In with Solana (SIWS) into IC canisters, allowing users to sign in using their Solana wallets.

### [ic-siws-provider](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws_provider)

Prebuilt canister serving as a SIWS identity provider for Internet Computer canisters. `ic_siws-provider` packages the [ic_siws](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws) library and makes it available as a canister that can easily be integrated into any Internet Computer application, independent of the application's programming language.

### [ic-siws-react-demo-rust](https://github.com/kristoferlund/ic-siws-react-demo-rust)

React demo application that demonstrates how to integrate SIWS into an Internet Computer canister using the [ic-use-siwe-identity](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic-use-siwe-identity) hook and [ic-siws-provider](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws_provider) canister.

Try the deployed demo here: https://shtr2-2iaaa-aaaal-qckva-cai.icp0.io

### [ic-use-siwe-identity](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic-use-siwe-identity)

React hook and context provider for easy frontend integration with SIWS enabled Internet Computer canisters.

### [ic-use-actor](https://github.com/kristoferlund/ic-use-actor)

React hook and context provider for managing Internet Computer (IC) actors with features like type safety and request/response interceptors. `ic-use-actor` makes interacting with Internet Computer canisters more fun!

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

## Future Plans

The project is still in active development. Before using `ic-siws` in production, I would like to do a more formal security audit.

Also, I want to integrate SIWS into more demo applications, ideally some wallet application.

Most likely, there are features missing in the current implementation. If you have any ideas or requests for features, please let me know by [opening an issue](https://github.com/kristoferlund/ic-siws/issues).