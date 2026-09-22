# Dashboard & Observability

Cons normalizes operational information from Solana and external transport providers into one developer view.

## Overview

A dashboard can display:

- Total routes.
- Successful requests.
- Failed requests.
- Supported chains.
- Supported providers.
- Supported assets.
- Current provider health.

## Active Transfer

```text
USDC
Solana -> Provider A -> Base
Status: IN_TRANSIT
Solana Signature: ...
Request ID: ...
```

## Route Comparison

Developers should be able to compare candidate providers by:

- Estimated cost.
- Estimated completion time.
- Availability.
- Security profile.
- Observed reliability.

## Developer Observability

Useful debugging information includes:

- API requests.
- Selected routes.
- Solana transaction signatures.
- Solana program errors.
- Provider submissions.
- Destination transaction IDs.
- Message IDs.
- Delivery times.
- Retry and fallback events.
- Error codes.

The goal is to make cross-chain failures understandable without forcing developers to inspect every provider independently.
