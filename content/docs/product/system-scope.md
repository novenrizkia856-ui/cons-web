# System Scope

Cons is a complete Solana-first cross-chain connectivity layer. An application describes the desired cross-chain outcome, and Cons determines how to coordinate, execute, verify, and track that outcome through supported transport infrastructure.

## Included System Capabilities

Cons includes:

- Solana-native routing and request coordination.
- Token routing between Solana and supported chains.
- Arbitrary message routing between Solana and supported chains.
- Route discovery and comparison.
- Cost, latency, security, availability, and reliability evaluation.
- Application-defined routing priorities and provider policies.
- Provider adapters with a normalized internal interface.
- Provider metadata and health monitoring.
- Chain, asset, provider, and route registries.
- Solana Program state represented through deterministic accounts and PDAs.
- SPL Token and Token-2022 aware asset metadata where supported.
- Transaction preparation and cross-chain submission coordination.
- Source and destination transaction tracking.
- Standard lifecycle states.
- Retry handling.
- Policy-controlled fallback routing.
- Standardized route receipts.
- Multi-path message delivery.
- Configurable quorum verification.
- API and SDK access.
- Developer dashboard and operational observability.

## Routing Domains

### Token Routing

Moves supported assets between Solana and supported external chains.

```text
SOURCE ASSET
    |
    v
   CONS
    |
    v
SELECTED PROVIDER
    |
    v
DESTINATION ASSET
```

### Message Routing

Moves arbitrary application messages between Solana Programs/applications and supported destination environments.

```text
SOLANA PROGRAM / APP
        |
        v
      MESSAGE
        |
        v
       CONS
        |
        v
 SELECTED TRANSPORT
        |
        v
DESTINATION CONTRACT / APP
```

The reverse direction follows the same normalized model.

## Shared Infrastructure

Token and message routing remain separate domains but share:

- Provider discovery.
- Compatibility checks.
- Route scoring and policy evaluation.
- Solana-side program state.
- Provider health monitoring.
- Status normalization.
- Delivery verification.
- Retry and fallback coordination.
- Receipts and observability.

## System Boundary

Cons does not implement a new cross-chain transport protocol. It coordinates and abstracts supported providers.

Cons is not:

- A new blockchain.
- A standalone bridge protocol.
- A token issuer.
- A DEX.
- A wallet.
- A custody service.
- A liquidity protocol.

Its role is to provide a Solana-native control and routing layer above existing cross-chain infrastructure.
