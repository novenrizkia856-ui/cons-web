# Use Cases

## Solana Wallets

A Solana wallet can expose cross-chain token transfers without maintaining a separate integration for every supported bridge provider.

## Solana DeFi Applications

A Solana DeFi application can move supported assets or communicate with applications on other supported networks while Cons handles route discovery and status normalization.

## Payments

A payment application can route supported stablecoins between Solana and other networks and receive a consistent request and receipt model.

## RWA Applications

A tokenized-asset application can use Cons as a connectivity layer between Solana and supported external ecosystems where compatible transport routes exist.

## Cross-Chain Applications

A Solana Program or application can send messages to supported destination applications for state synchronization, instructions, or coordination.

## General Developers

Developers can use one Cons SDK/API and one Solana-side integration model instead of learning each transport provider separately.

## Core Value Proposition

```text
Application intent
      |
      v
 route discovery
      |
 policy filtering
      |
 provider selection
      |
Solana transaction preparation
      |
cross-chain execution
      |
 verification
      |
 retry / fallback when safe and allowed
      |
 normalized receipt
```
