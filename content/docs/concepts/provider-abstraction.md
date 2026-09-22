# Provider Abstraction

Provider abstraction is a core Cons concept.

Each supported bridge or messaging transport is normalized behind the same internal behavior model while preserving provider-specific Solana requirements inside its adapter.

```text
Provider Adapter
├── quote
├── prepare
├── send
├── status
└── verify
```

Conceptually:

```ts
interface ProviderAdapter {
  quote(request): Promise<Quote>;
  prepare(request): Promise<PreparedRoute>;
  send(request): Promise<Submission>;
  getStatus(id): Promise<Status>;
  verify(message): Promise<Verification>;
}
```

This interface describes the architecture rather than a mandatory implementation signature.

## Why Adapters Matter

Different providers may use different:

- Solana Programs.
- CPI interfaces.
- Accounts.
- Relayers.
- Fee models.
- Message formats.
- Token custody or burn/mint mechanisms.
- Verification models.

The routing engine should not embed those differences everywhere.

## Provider Metadata

A provider profile may contain:

```json
{
  "provider": "ProviderA",
  "supportsSolana": true,
  "supportedChains": ["Solana", "Base", "Ethereum"],
  "securityModel": "provider-defined",
  "status": "active",
  "programs": {
    "solana": "ProviderProgramPublicKey..."
  }
}
```

Cons uses this metadata for eligibility and transaction preparation.

## Solana Provider Integration

When a provider exposes a Solana Program, its adapter knows the accounts and instruction model required by that provider. Cons can prepare the appropriate interaction without exposing provider-specific details to the application.
