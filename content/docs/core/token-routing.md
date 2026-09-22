# Token Routing

Token Routing moves supported assets between Solana and supported external chains through an approved transport path.

```text
USDC on Solana
      |
      v
     CONS
      |
      v
Selected Provider
      |
      v
USDC on Destination Chain
```

The reverse direction uses the same normalized Cons model.

## Token Transfer Flow

1. The application submits the source chain, destination chain, asset, amount, recipient, and routing policy.
2. Cons resolves the chain-specific asset identity.
3. Cons checks provider, asset, and route compatibility.
4. The routing engine compares eligible routes.
5. Cons prepares the required transaction path.
6. If Solana is the source, the application signs the required Solana transaction and the Cons Program validates the relevant accounts and authority.
7. The selected provider begins cross-chain transport.
8. Cons tracks the Solana signature, provider state, and destination transaction.
9. Destination delivery is detected and verified.
10. Cons returns a normalized final receipt.

## Solana Asset Model

On Solana, a supported token is identified by its mint and token-program context, not by ticker symbol alone.

Conceptually, the asset registry may track:

```text
asset identity
Solana mint
Solana token program
external-chain representation
supported providers
supported route pairs
```

Associated Token Accounts may be used for standard recipient flows where appropriate.

## Route Compatibility

A route is valid only when all required conditions are true:

```text
source chain supported
AND destination chain supported
AND asset representation supported
AND Solana token-program behavior compatible
AND provider operational
AND provider supports the chain pair
AND route allowed by application policy
```

## Asset Registry

The Cons asset registry prevents the system from assuming that assets with the same display symbol are equivalent across chains.

A registry entry can map one logical asset to its supported chain-specific representations and transport providers.
