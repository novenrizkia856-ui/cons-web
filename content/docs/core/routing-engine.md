# Routing Engine

The Routing Engine chooses among compatible cross-chain paths.

It operates primarily outside the Solana Program because route selection depends on dynamic information such as provider quotes, current availability, observed reliability, and estimated latency.

## Route Inputs

A route decision may consider:

- Source and destination chain.
- Asset or message type.
- Provider support.
- Solana mint and token-program compatibility.
- Current provider availability.
- Estimated provider and network cost.
- Estimated latency.
- Security configuration.
- Recent reliability.
- Application allowlists and policy.

## Route Comparison

Conceptual example:

| Route | Cost | ETA | Security | Status |
|---|---:|---:|---|---|
| Provider A | $2.10 | 3 min | Standard | Active |
| Provider B | $1.40 | 8 min | Standard | Active |
| Provider C | $3.20 | 1 min | Higher assurance | Active |

The table illustrates normalized comparison. Provider-specific measurements remain external observations rather than guarantees from the Solana Program.

## Priorities

Applications can express routing preferences such as:

```json
{ "priority": "cost" }
```

```json
{ "priority": "speed" }
```

```json
{ "priority": "security" }
```

## Eligibility Before Optimization

Cons first determines whether a route is allowed and technically compatible. Only eligible routes are compared for optimization.

```text
COMPATIBILITY
    |
    v
POLICY FILTER
    |
    v
HEALTH FILTER
    |
    v
ROUTE COMPARISON
    |
    v
SELECTED ROUTE
```

## Route Commitment

After a route is selected, the request can bind itself to the relevant provider and parameters before execution. This prevents a prepared Solana transaction from silently changing to an unrelated route after user authorization.
