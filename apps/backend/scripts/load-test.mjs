
import { randomUUID } from "node:crypto";

const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:5000/api";

const PROJECT_ID = process.env.PROJECT_ID;
const API_KEY = process.env.API_KEY;
const DURATION_SECONDS = Number(process.env.DURATION_SECONDS || 60);

const CONCURRENT_RUNS = 50;
const EVENTS_PER_SECOND = 10;
const INTERVAL_MS = 1000;

if (!PROJECT_ID || !API_KEY) {
  console.error("Missing PROJECT_ID or API_KEY environment variable.");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
};

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const results = {
  requests: 0,
  failedRequests: 0,
  acceptedEvents: 0,
  duplicateEvents: 0,
  latencies: [],
  errors: [],
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    signal: AbortSignal.timeout(30000),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `${response.status}: ${body.message || "Request failed"}`
    );
  }

  return body;
}

async function createRuns() {
  console.log(`Creating ${CONCURRENT_RUNS} runs...`);

  const runs = await Promise.all(
    Array.from({ length: CONCURRENT_RUNS }, async (_, index) => {
      const response = await request(
        `/projects/${PROJECT_ID}/runs`,
        {
          method: "POST",
          body: JSON.stringify({
            name: `LOAD-TEST-${Date.now()}-${index + 1}`,
          }),
        }
      );

      return response.data;
    })
  );

  console.log(`Created ${runs.length} runs successfully.`);
  return runs;
}

function createEvents(runIndex, sequence) {
  return Array.from({ length: EVENTS_PER_SECOND }, (_, index) => ({
    eventId: randomUUID(),
    sequence: sequence + index,
    name: index % 2 === 0 ? "accuracy" : "loss",
    value:
      index % 2 === 0
        ? Number((0.85 + Math.random() * 0.15).toFixed(5))
        : Number((Math.random() * 0.3).toFixed(5)),
    step: sequence + index,
    occurredAt: new Date().toISOString(),
  }));
}

async function testRun(run, runIndex, endAt) {
  const clientId = `load-client-${run.id}`;
  let sequence = 1;
  let nextTick = Date.now();

  let acceptedForRun = 0;
  let sentBatches = 0;

  while (Date.now() < endAt) {
    const wait = nextTick - Date.now();

    if (wait > 0) {
      await sleep(wait);
    }

    if (Date.now() >= endAt) break;

    const events = createEvents(runIndex, sequence);

    const payload = {
      batchId: randomUUID(),
      clientId,
      events,
    };

    const startedAt = Date.now();

    try {
      const response = await request(`/runs/${run.id}/metrics`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const latency = Date.now() - startedAt;
      const result = response.data;

      results.requests++;
      results.latencies.push(latency);
      results.acceptedEvents += result.acceptedCount || 0;
      results.duplicateEvents += result.duplicateCount || 0;

      acceptedForRun += result.acceptedCount || 0;
      sentBatches++;
    } catch (error) {
      results.requests++;
      results.failedRequests++;
      results.errors.push({
        runId: run.id,
        message: error.message,
      });
    }

    sequence += EVENTS_PER_SECOND;
    nextTick += INTERVAL_MS;
  }

  return {
    runId: run.id,
    sentBatches,
    acceptedEvents: acceptedForRun,
  };
}

function percentile(values, percent) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percent / 100) * sorted.length) - 1;

  return sorted[Math.max(0, index)];
}

async function verifyDatabase(runResults) {
  console.log("\nVerifying metrics through the API...");

  let totalDatabaseEvents = 0;
  let mismatches = 0;

  for (const result of runResults) {
    try {
      const response = await request(
        `/runs/${result.runId}/metrics`
      );

      const databaseCount = response.data.length;
      totalDatabaseEvents += databaseCount;

      if (databaseCount !== result.acceptedEvents) {
        mismatches++;

        console.error(
          `Mismatch: ${result.runId}: expected ${result.acceptedEvents}, found ${databaseCount}`
        );
      }
    } catch (error) {
      mismatches++;
      console.error(`Verification failed for ${result.runId}:`, error.message);
    }
  }

  return { totalDatabaseEvents, mismatches };
}

async function main() {
  console.log("\nStarting experiment tracker load test");
  console.log("--------------------------------------");
  console.log(`Concurrent runs: ${CONCURRENT_RUNS}`);
  console.log(`Events per run/sec: ${EVENTS_PER_SECOND}`);
  console.log(`Target events/sec: ${CONCURRENT_RUNS * EVENTS_PER_SECOND}`);
  console.log(`Duration: ${DURATION_SECONDS} seconds`);

  const runs = await createRuns();

  const startAt = Date.now() + 2000;
  const endAt = startAt + DURATION_SECONDS * 1000;

  console.log("\nLoad test started...\n");

  await sleep(Math.max(0, startAt - Date.now()));

  const runResults = await Promise.all(
    runs.map((run, index) =>
      testRun(run, index, endAt)
    )
  );

  const verification = await verifyDatabase(runResults);

  const actualDuration =
    DURATION_SECONDS;

  const p50 = percentile(results.latencies, 50);
  const p95 = percentile(results.latencies, 95);
  const p99 = percentile(results.latencies, 99);

  console.log("\n========== LOAD TEST RESULTS ==========");
  console.log(`Runs: ${runs.length}`);
  console.log(`Duration: ${actualDuration}s`);
  console.log(`Successful requests: ${results.requests - results.failedRequests}`);
  console.log(`Failed requests: ${results.failedRequests}`);
  console.log(`Accepted events: ${results.acceptedEvents}`);
  console.log(`Duplicate events: ${results.duplicateEvents}`);
  console.log(
    `Actual throughput: ${(results.acceptedEvents / actualDuration).toFixed(2)} events/sec`
  );
  console.log(`API latency p50: ${p50}ms`);
  console.log(`API latency p95: ${p95}ms`);
  console.log(`API latency p99: ${p99}ms`);
  console.log(`Database/API total metrics: ${verification.totalDatabaseEvents}`);
  console.log(`Run count mismatches: ${verification.mismatches}`);
  console.log("=======================================\n");

  if (results.errors.length) {
    console.log("First 10 errors:");
    console.log(results.errors.slice(0, 10));
  }

  console.log(
    results.failedRequests === 0 &&
    verification.mismatches === 0 &&
    verification.totalDatabaseEvents === results.acceptedEvents
      ? "RESULT: LOAD TEST PASSED"
      : "RESULT: LOAD TEST NEEDS INVESTIGATION"
  );
}

main().catch((error) => {
  console.error("Load test failed:", error);
  process.exit(1);
});
