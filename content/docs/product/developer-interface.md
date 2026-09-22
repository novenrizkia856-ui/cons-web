# Developer Interface

Cons should feel like one Solana-native product even when several transport providers exist underneath it.

## SDK Concept

A developer expresses the intended transfer instead of writing provider-specific code.

```ts
const route = await cons.transfer({
  sourceChain: "solana",
  destinationChain: "base",
  token: "USDC",
  amount: "100",
  recipient: "0x..."
});
```

The SDK conceptually handles:

- Route discovery.
- Provider selection.
- Solana account discovery.
- Transaction and instruction preparation.
- Wallet-signature flow.
- Status tracking.
- Receipt generation.

## Message Concept

```ts
const message = await cons.sendMessage({
  sourceChain: "solana",
  destinationChain: "ethereum",
  payload,
  recipient: destinationApplication
});
```

## API Concept

| Endpoint | Purpose |
|---|---|
| `GET /v1/routes` | Discover compatible routes |
| `POST /v1/quote` | Return normalized route estimates |
| `POST /v1/transfer` | Create or prepare a token-transfer request |
| `POST /v1/message` | Create or prepare a cross-chain message request |
| `GET /v1/messages/{id}` | Read normalized message status |
| `GET /v1/transfers/{id}` | Read normalized transfer status |
| `GET /v1/providers` | List supported providers |
| `GET /v1/chains` | List supported chains |
| `GET /v1/tokens` | List supported assets and representations |
| `GET /v1/health` | Read Cons and provider health |

These endpoints describe the product interface and do not prescribe the backend implementation.

## Wallet Model

Cons does not take ownership of the user's wallet. When a Solana transaction requires user authorization, the application presents the prepared transaction or instructions to the user's Solana wallet for signing.

## Core Developer Promise

A Solana developer integrates Cons once instead of maintaining separate bridge and messaging integrations for every supported provider.
