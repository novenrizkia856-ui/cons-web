# System Architecture

Cons separates **application intent**, **Solana-side coordination**, **route selection**, and **cross-chain transport**.

```text
APPLICATION / SDK
       |
       v
 ROUTING API
       |
       v
 ROUTING ENGINE
       |
       +------------------+
       |                  |
       v                  v
SOLANA PROGRAM      PROVIDER ADAPTERS
       |              /   |   \
       |             A    B    C
       |              \   |   /
       +---------> CROSS-CHAIN TRANSPORT
                         |
                         v
                  DESTINATION CHAIN
```

## 1. Application Layer

Wallets, dapps, protocols, payment systems, and other products express the desired transfer or message through Cons.

## 2. API & SDK Layer

The API and SDK normalize developer interaction. They expose route discovery, quotes, request creation, transaction preparation, status tracking, and receipts.

## 3. Routing Engine

The routing engine evaluates eligible providers according to compatibility, cost, speed, security policy, health, and reliability.

## 4. Solana Program Layer

The Cons Solana Program represents the on-chain control layer. Conceptually, it is responsible for the Solana-native parts of the request lifecycle, including:

- Validating request parameters and account relationships.
- Recording deterministic request or policy state when on-chain state is required.
- Coordinating supported SPL token flows.
- Emitting events/logs that can be indexed by Cons infrastructure.
- Enforcing relevant authority and replay-protection rules.
- Interacting with supported Solana-side provider programs through CPI where appropriate.

## 5. Provider Adapter Layer

Adapters translate provider-specific interfaces into a shared Cons model.

## 6. Cross-Chain Transport Layer

Existing bridge and messaging protocols carry assets or messages between Solana and destination environments.

## 7. Tracking & Verification Layer

Cons observes Solana signatures, provider states, destination transactions, confirmations, and delivery evidence, then maps them to a normalized Cons lifecycle.

## Architectural Principle

The Solana Program should contain deterministic on-chain rules. Route discovery, provider comparison, health evaluation, indexing, and operational coordination can remain outside the program where they require dynamic external information.
