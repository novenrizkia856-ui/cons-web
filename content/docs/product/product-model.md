# Product Model

## The Problem

A Solana application that needs cross-chain connectivity must deal with infrastructure outside the normal Solana program model: bridge providers, message transports, foreign chain identifiers, foreign token representations, provider fees, verification systems, delivery tracking, and failure recovery.

If each application integrates those systems independently, the same complexity is repeated many times.

## The Cons Model

Cons places one routing layer between a Solana application and multiple supported cross-chain transport providers.

```text
SOLANA APPLICATION
       |
       v
      CONS
       |
       v
 ROUTING ENGINE
   /    |    \
  A     B     C     <- transport providers
   \    |    /
       v
EXTERNAL CHAIN
```

Cons can also normalize supported routes returning from an external chain into Solana.

## Request Model

A token-routing request conceptually contains:

```json
{
  "sourceChain": "Solana",
  "destinationChain": "Base",
  "token": "USDC",
  "amount": "100",
  "recipient": "0x...",
  "priority": "cost"
}
```

A route returning to Solana may use a Solana wallet as the recipient:

```json
{
  "sourceChain": "Ethereum",
  "destinationChain": "Solana",
  "token": "USDC",
  "amount": "100",
  "recipient": "SolanaPublicKey..."
}
```

## Routing Preferences

Applications may specify policies such as:

```json
{ "priority": "cost" }
```

```json
{ "priority": "speed" }
```

```json
{ "priority": "security" }
```

## What Cons Decides

For each request, Cons determines:

- Whether the source and destination are supported.
- Whether the asset or message can use an available route.
- Whether the required Solana accounts and program state are valid.
- Which providers are operational and compatible.
- Estimated cost and completion time.
- Applicable security configuration.
- Which route matches application policy.

The result is a normalized route that the application can execute through one Cons interface.
