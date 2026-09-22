# Cons

**Cons** is a Solana-first cross-chain token and message routing layer. It gives applications one consistent interface for moving supported assets and messages between Solana and other supported blockchains.

Instead of integrating every bridge or messaging provider separately, an application integrates with Cons once. Cons discovers compatible transport paths, compares eligible providers, applies routing policy, coordinates the Solana-side transaction flow, tracks cross-chain execution, and returns a normalized receipt.

> **Simple definition:** One Solana-native routing layer for moving tokens and messages across chains.

## Why Cons Exists

Cross-chain applications must normally handle different bridge interfaces, messaging systems, token representations, fee models, verification methods, transaction states, retries, and provider-specific failure modes.

Cons places a single routing and coordination layer above that fragmented infrastructure.

## Solana-First Model

Cons is built around Solana as its primary on-chain environment.

The Solana side of the system uses:

- Solana Programs for on-chain routing rules and request coordination.
- Program Derived Addresses (PDAs) for deterministic Cons-owned state.
- SPL Token and Token-2022 compatible asset handling where supported.
- Associated Token Accounts for standard recipient token-account flows.
- Instructions and Cross-Program Invocations when interacting with Solana programs.
- Solana transaction signatures and account state as part of normalized receipts.

Cross-chain transport itself is provided by supported external bridge and messaging protocols. Cons does not replace those protocols; it abstracts and coordinates them.

## Core Capabilities

- Token routing between Solana and supported chains.
- Arbitrary cross-chain message routing.
- Route discovery and comparison.
- Provider selection by cost, speed, security, reliability, or application policy.
- Solana-native request and policy state.
- Standardized request lifecycle and receipts.
- Retry and policy-controlled fallback behavior.
- Provider health and compatibility awareness.
- Multi-path message verification with configurable quorum rules.
- Unified chain, asset, provider, route, transfer, and message registries.
- Developer-facing API and SDK abstractions.
- Cross-chain status tracking and operational observability.

## Product Boundary

Cons is **not** a new blockchain, bridge, DEX, wallet, custody service, token issuer, or liquidity protocol. It uses Solana as its native execution environment while routing through existing cross-chain transport infrastructure.

## Complete Product Model

```text
CONS
├── Solana Control Layer
├── Token Routing
└── Message Routing
```

The routing domains share provider discovery, compatibility checks, policy evaluation, Solana-side state, execution tracking, verification, retry and fallback handling, receipts, and observability.

The developer promise remains simple:

> Integrate Cons once and use one consistent interface for supported cross-chain routes involving Solana.
