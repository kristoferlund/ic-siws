# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-04-25

This is a breaking change release that makes the nonce feature standard. The nonce feature is now enabled by default and the `nonce` feature flag is deprecated. This version also includes fixes to increase login flow security.

### Added
* [Secure generated SIWS messages using a nonce](https://github.com/kristoferlund/ic-siws/commit/6d4fbab7438c65c4bde1c54d87d73a094cdac849)

### Changed
* [Make the nonce feature standard](https://github.com/kristoferlund/ic-siws/commit/784bade5cefb0bb8ef188263986a906a0814c3d0)

### Fixed
* [Ensure SIWS messages are always removed on login](https://github.com/kristoferlund/ic-siws/commit/de3f015fd6a039da0d27e15484e38ab602672b5a)
* [Return error if signature has expired](https://github.com/kristoferlund/ic-siws/commit/5632a0ff8f7bb4b6814eda4554c20b22a955ce27)


## [0.0.2] - 2024-08-28

### Changed

- Updated dependencies: ic-cdk

## [0.0.1] - 2024-04-03

### Added

- First release. `ic_siws` is an adaption of the [ic-siwe](https://github.com/kristoferlund/ic-siwe) project for use with Solana.
