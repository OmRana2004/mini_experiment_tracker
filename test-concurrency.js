
const RUN_ID = "fc77e40f-1a98-47af-91c3-1f487eb3980c";
const API_KEY = "exp_live_eabcff8ac61c193bc5936ef7011330b7299152a6a7c5b4964d5a696f5c28feaf";
const BASE_URL = "http://localhost:5000";

const TOTAL_REQUESTS = 10;
const TEST_ID = Date.now();

async function sendBatch(index) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/runs/${RUN_ID}/metrics`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          batchId: `concurrent-batch-${TEST_ID}-${index}`,
          clientId: `concurrent-client-${TEST_ID}`,
          events: [
            {
              eventId: `concurrent-event-${TEST_ID}-${index}`,
              sequence: index + 1,
              name: "accuracy",
              value: 0.8 + index / 100,
              step: index + 1,
              occurredAt: new Date().toISOString(),
            },
          ],
        }),
      }
    );

    const data = await response.json();

    return {
      request: index,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      request: index,
      status: "NETWORK_ERROR",
      error: error.message,
    };
  }
}

async function main() {
  console.log(`Starting ${TOTAL_REQUESTS} concurrent requests...`);
  console.log(`Test ID: ${TEST_ID}`);

  const results = await Promise.all(
    Array.from({ length: TOTAL_REQUESTS }, (_, i) =>
      sendBatch(i + 1)
    )
  );

  console.log("\nTest Results:");
  console.log(JSON.stringify(results, null, 2));

  const successful = results.filter(
    (result) => result.status === 200
  ).length;

  const failed = TOTAL_REQUESTS - successful;

  console.log("\n--- Summary ---");
  console.log(`Successful requests: ${successful}/${TOTAL_REQUESTS}`);
  console.log(`Failed requests: ${failed}/${TOTAL_REQUESTS}`);
}

main().catch(console.error);
