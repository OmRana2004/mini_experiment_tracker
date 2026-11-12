# Mini Experiment Tracker — Technical Design Note

## 1. Event Format and Ordering

Each metric event contains an `eventId`, `clientId`, `clientSequence`, metric `name`, `value`, optional `step`, and `occurredAt` timestamp. Events are submitted in batches identified by a `batchId`.

The system uses a server-assigned `runSequence` as the canonical ordering mechanism. The `Run.nextSequence` counter provides the next sequence number. Accepted events are assigned sequence numbers and stored with their run and project identifiers.

The database enforces uniqueness for:
- `(runId, eventId)` — prevents duplicate event IDs.
- `(runId, clientId, clientSequence)` — prevents duplicate client sequence numbers.
- `(runId, runSequence)` — prevents duplicate server sequence numbers.

This means client timestamps and arrival order do not determine the final canonical order. The server-assigned sequence is used to order persisted events and stream updates.

## 2. Batch Retry and Duplicate Handling

Every ingestion batch has a `batchId` and `clientId`. The database stores the batch's `payloadHash`, accepted event count, and response.

A retry should use the same batch ID and identical payload. The stored batch record allows the server to identify a previously processed batch and return its recorded response instead of ingesting it again.

The event-level unique constraints provide an additional layer of duplicate protection. Reusing a batch ID with a different payload must be treated as a conflict rather than silently accepted.

Metric events, the ingestion batch record, and corresponding outbox events are intended to be persisted atomically. This avoids reporting a successful batch when only part of its data has been committed.

## 3. Reconnect and Missed Event Recovery

The live stream uses server-sent events (SSE). Each streamed event carries its `runSequence` as its event ID.

When a client reconnects, it sends its last received event ID through `Last-Event-ID`. The server can use this sequence as a cursor to retrieve later events from the persisted outbox, ordered by `runSequence`.

The outbox separates durable event storage from live delivery. A disconnected client can catch up from persisted events instead of relying only on events emitted while it was connected.

The frontend uses a streaming fetch connection and retry logic. The client should ignore already-applied sequence numbers and process new events in order.

## 4. Project Isolation

Projects are identified by UUIDs. API keys are associated with a project, and API-key authentication resolves the project context for protected requests.

Run, metric, batch, and outbox records contain project identifiers. Composite relationships between runs and project IDs help prevent records from being associated with a run belonging to another project.

Read operations, ingestion, and live subscriptions must be scoped to the authenticated project. The same scope must apply to replay queries after an SSE reconnect.

Isolation must also cover guessed resource IDs, error responses, caches, logs, and timing behavior. These are security properties that require automated cross-project tests; database relationships and API-key authentication alone do not prove complete isolation.

## 5. Reliability Considerations

The main reliability mechanisms are server-assigned ordering, idempotency keys, database uniqueness constraints, transactional persistence, and an outbox-based replay mechanism.

Important remaining failure cases to verify include concurrent retries, partial writes, reconnect gaps, duplicate stream delivery, slow-client queue overflow, and behavior after API-key rotation.

The system should only be considered ready for the target workload after consistency, isolation, failure-recovery, and load tests have been executed and their raw results reviewed.