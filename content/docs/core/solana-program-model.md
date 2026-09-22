# Solana Program Model

Cons uses Solana as its native on-chain control environment.

This page describes the conceptual program model. It defines responsibilities and state relationships without prescribing a final code layout.

## Program Responsibilities

The Cons Program may represent and enforce:

- Request identity.
- Request ownership or initiating authority.
- Routing policy references.
- Supported provider or route policy references.
- Solana-side token movement authorization.
- Request status checkpoints that require on-chain state.
- Replay protection.
- Administrative configuration and authority boundaries.

Dynamic provider quoting and route optimization remain outside the program because those inputs depend on external provider data and changing network conditions.

## Program Derived Addresses

PDAs provide deterministic addresses for Cons-owned state.

Conceptual account families include:

```text
Cons Config PDA
Provider Registry PDA(s)
Asset Registry PDA(s)
Route Policy PDA(s)
Request / Transfer PDA(s)
Message PDA(s)
```

The exact account decomposition is an implementation decision. The conceptual requirement is that Cons state is deterministic, attributable to the Cons Program, and isolated by request or configuration domain where appropriate.

## Token Accounts

For Solana-side token routing, Cons works with the Solana token account model.

Relevant concepts include:

- Mint accounts.
- Token accounts.
- Associated Token Accounts.
- SPL Token.
- Token-2022 where a supported route and provider are compatible with it.

Cons should treat a token by its chain-specific identity rather than assuming that the same symbol represents the same asset everywhere.

## Instructions

Conceptually, the program may expose instructions corresponding to actions such as:

```text
initialize / configure
register policy
create transfer request
create message request
submit or authorize route
record verification
finalize request
cancel eligible request
```

These names describe the system model rather than a required instruction API.

## CPI

When a supported provider exposes a Solana Program, Cons may interact with it through Cross-Program Invocation.

```text
Cons Program
    |
    | CPI
    v
Provider Program
```

Cons should not assume every provider has the same CPI model. Provider-specific behavior remains isolated behind the provider abstraction.

## Signatures and Authorities

Solana transactions identify authorized actions through transaction signatures and account constraints.

Cons distinguishes conceptually between:

- User authority.
- Cons configuration authority.
- Program-derived authority.
- Provider-specific authority where required.

Authority should be explicit and scoped to the minimum state or operation it controls.

## On-Chain vs Off-Chain Boundary

### On-chain

- Deterministic authorization.
- Solana account validation.
- Token-account relationships.
- Request state requiring trustless persistence.
- Replay protection.
- Program-to-program interaction.

### Off-chain

- Provider quote collection.
- Cost and latency comparison.
- Provider health monitoring.
- Route scoring.
- Cross-chain indexing.
- Retry scheduling.
- API and dashboard services.

This boundary keeps the Solana Program deterministic while allowing Cons to reason about external systems that cannot be known directly by a Solana Program.
