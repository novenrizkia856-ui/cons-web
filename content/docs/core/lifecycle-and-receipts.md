# Lifecycle, Status & Receipts

Cons provides one normalized lifecycle across Solana transactions and multiple cross-chain providers.

## Standard Lifecycle

```text
CREATED
   |
SUBMITTED
   |
IN_TRANSIT
   |
DESTINATION_RECEIVED
   |
CONFIRMED
```

## Failure and Alternate States

A request may also enter:

- `FAILED`
- `EXPIRED`
- `RETRYING`
- `CANCELLED`

The provider may expose different internal states. Cons maps those states into the shared Cons model.

## Solana Transaction Identity

When a request touches Solana, the Solana transaction signature is part of the request evidence.

Conceptual status object:

```json
{
  "requestId": "cons-request-id",
  "status": "IN_TRANSIT",
  "sourceChain": "Solana",
  "destinationChain": "Base",
  "sourceSignature": "SolanaTransactionSignature...",
  "route": "provider-a"
}
```

## Route Receipt

A normalized receipt can contain chain-specific transaction identities without forcing every chain into an EVM-style transaction-hash format.

```json
{
  "requestId": "cons-request-id",
  "source": {
    "chain": "Solana",
    "transactionId": "SolanaTransactionSignature..."
  },
  "destination": {
    "chain": "Base",
    "transactionId": "0x..."
  },
  "route": {
    "provider": "ProviderA"
  },
  "status": "CONFIRMED",
  "timestamps": {
    "submitted": "...",
    "confirmed": "..."
  }
}
```

## Why Receipts Matter

The receipt gives developers one normalized source of truth for:

- Request identity.
- Route used.
- Solana transaction signature when applicable.
- Destination transaction identity.
- Final status.
- Important timestamps.

Cons therefore standardizes status without pretending all chains use the same transaction model.
