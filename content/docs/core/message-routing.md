# Message Routing

Message Routing sends arbitrary application messages between Solana and supported external chains.

```text
SOLANA APP / PROGRAM
        |
        v
      MESSAGE
        |
        v
       CONS
        |
        v
TRANSPORT PROVIDER
        |
        v
DESTINATION CONTRACT / APP
```

The same model can normalize messages returning to Solana.

## Example Uses

Cross-chain messages may represent:

- Governance instructions.
- State synchronization.
- Contract or program instructions.
- Asset notifications.
- Cross-chain application coordination.

## Message Flow

1. The application defines the source, destination, payload, and routing policy.
2. Cons produces a deterministic request/message identity.
3. Compatible message transports are discovered.
4. The routing engine selects an allowed route.
5. The Solana-side request is authorized or recorded when required.
6. The message is submitted through the selected provider.
7. Cons tracks transport and destination delivery.
8. Destination evidence is verified.
9. A normalized final status and receipt are produced.

## Message Identity

A Cons message must be uniquely identifiable across retries and transport paths. The identity should bind the intended source, destination, payload or payload commitment, and request context strongly enough to prevent accidental ambiguity or replay.

## Destination Execution

Cons distinguishes **message delivery** from **destination execution**.

A provider may prove that a message reached the destination environment, while a destination application may separately determine whether and how that message is executed.

This separation makes status reporting explicit and avoids treating transport delivery as equivalent to successful application logic.

## Separation From Token Routing

Token and message routing share routing infrastructure but remain independent product domains.

```text
CONS
├── Token Routing
└── Message Routing
```
