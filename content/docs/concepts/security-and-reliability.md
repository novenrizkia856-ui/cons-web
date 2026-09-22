# Security & Reliability

Cons separates routing convenience from trust assumptions. A route is eligible only when its provider, asset, chain pair, Solana accounts, and application policy are compatible.

## Solana Account Validation

The Cons Program should treat account relationships as explicit security boundaries.

Relevant checks conceptually include:

- Expected program ownership.
- Expected PDA derivation.
- Correct mint and token accounts.
- Correct initiating authority.
- Correct provider program where a provider interaction is expected.
- Writable and signer privileges matching the intended action.

## Authority Separation

Administrative configuration, user authorization, program-derived authority, and provider authority should remain distinct.

No authority should implicitly control unrelated Cons state.

## Replay Protection

Cross-chain systems must avoid executing the same intended message or transfer more than allowed.

Cons request identity and state should make already-consumed or finalized requests distinguishable from new requests.

## Provider Allowlisting

Applications may restrict Cons to approved providers.

```text
Only use providers approved by this application policy.
```

## Provider Health

Cons distinguishes between a provider that is supported and one that is currently usable.

Useful external health signals include:

- Operational status.
- Route availability.
- Recent success and failure behavior.
- Confirmation delays.

## Retry

A request may enter `RETRYING` after a temporary failure when repeating the action is safe.

Retry must preserve request identity and must not unintentionally duplicate token movement or message execution.

## Fallback

Fallback selects another compatible provider only when policy allows route switching and the current request state makes switching safe.

- **Retry** attempts the intended operation again.
- **Fallback** changes the selected route.

## Multi-Path Messaging

Cons supports application policies in which the same logical message is transported through multiple approved providers.

```text
              +-> Provider A ->+
SOLANA -------+-> Provider B ->+-> QUORUM -> DESTINATION
              +-> Provider C ->+
```

Example:

```text
Require 2 of 3 approved transport confirmations.
```

The application accepts the message only after its configured verification rule is satisfied.

## Trust Boundary

Cons can normalize and enforce its own policies, but the underlying security of a cross-chain route still depends on the selected transport provider and its verification model. Cons does not erase that provider trust assumption; it makes the assumption explicit and selectable.
