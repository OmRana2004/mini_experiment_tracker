
# Experiment Tracker - Design

## 1. Metric Event Format

Python client sends metrics to the backend in batches.

Each metric contains:

- eventId: Unique ID of the event.
- batchId: Unique ID of the batch.
- clientId: ID of the client sending metrics.
- sequence: Event order from the client.
- name: Metric name (accuracy, loss).
- value: Metric value.
- step: Training step or epoch.
- timestamp: When the metric was created.

## 2. Event Ordering

- Every event has a client sequence number.
- The backend assigns a sequence number to each accepted event.
- Events are stored in the order accepted by the backend.
- Late events are also saved with their original timestamp.

## 3. Duplicate Batches

- Every batch has a unique batchId.
- If the same batch is sent again with the same data, the backend returns the previous result.
- If the same batchId is sent with different data, the backend rejects it.
- Duplicate events must not be stored twice.

## 4. Reconnecting After Disconnect

- We use Server-Sent Events (SSE) for live metric updates.
- Every event has an ID.
- When the connection drops, the client remembers the last received event ID.
- After reconnecting, the backend sends all missed events from the database.
- PostgreSQL is the main source of stored data.

## 5. Project Isolation

- Every API key belongs to one project.
- The backend identifies the project using the API key.
- Users can only access runs and metrics belonging to their project.
- One project's API key cannot access another project's data.
- The same isolation rules apply to API requests and SSE connections.

## 6. Consistency

- Metrics are saved in PostgreSQL before being sent to connected clients.
- If a client disconnects, it can recover missed events.
- The final metrics shown on the run page must match the database.

## 7. Things We Will Test

- Events arriving out of order.
- Duplicate batches.
- Late events.
- Connection disconnect and reconnect.
- Access between different projects.
- Lost events and duplicate events.
- Slow clients and partial writes.
- Old API keys after rotation.
- 50 concurrent runs sending 10 events per second.
