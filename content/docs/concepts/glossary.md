# Glossary

## Application

The wallet, dapp, protocol, payment system, or other software integrating with Cons.

## Solana Program

The on-chain executable component of Cons deployed on Solana.

## PDA

Program Derived Address. A deterministic address that can represent state or authority controlled by a Solana Program without a private key.

## SPL Token

The standard Solana token-program model used by many fungible and non-fungible assets.

## Token-2022

An extended Solana token program with additional token features. Cons support depends on route and provider compatibility.

## Associated Token Account

A conventionally derived token account associated with a wallet and a specific mint.

## CPI

Cross-Program Invocation. A Solana Program calling another Solana Program within transaction execution.

## Source Chain

The blockchain where a token transfer or message begins.

## Destination Chain

The blockchain where the requested token or message should arrive.

## Provider

An external cross-chain bridge or messaging system that Cons can route through.

## Provider Adapter

The normalization layer that translates provider-specific behavior, including Solana-specific requirements, into the internal Cons model.

## Route

A compatible cross-chain path through a selected provider.

## Routing Engine

The Cons component that evaluates compatibility, external provider information, and application policy to select a route.

## Quote

An estimate describing a route, including expected cost, completion time, and provider information.

## Token Routing

Movement of a supported asset between Solana and another supported chain through a selected provider.

## Message Routing

Delivery of an application message between Solana and another supported chain.

## Request ID

A Cons identifier that distinguishes one logical cross-chain operation from another and supports tracking and replay protection.

## Transaction Signature

The standard identifier used for a submitted Solana transaction.

## Retry

A safe re-attempt of an operation after a temporary failure.

## Fallback

Selection of another compatible provider or route after the original route becomes unavailable or fails, when policy and request state permit it.

## Receipt

A normalized machine-readable record containing request, route, transaction, status, and timing information.

## Quorum

A rule requiring multiple independent transport confirmations before a message is accepted.
