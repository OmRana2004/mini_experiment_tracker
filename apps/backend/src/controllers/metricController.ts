
import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import { prismaClient } from "@repo/db/client";

type MetricInput = {
  eventId: string;
  sequence: number;
  name: string;
  value: number;
  step?: number;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

type BatchInput = {
  batchId: string;
  clientId: string;
  events: MetricInput[];
};

function validateBatch(body: unknown): body is BatchInput {
  if (!body || typeof body !== "object") return false;

  const batch = body as Record<string, unknown>;

  if (
    typeof batch.batchId !== "string" ||
    !batch.batchId.trim() ||
    typeof batch.clientId !== "string" ||
    !batch.clientId.trim() ||
    !Array.isArray(batch.events) ||
    batch.events.length === 0
  ) {
    return false;
  }

  return batch.events.every((event: unknown) => {
    if (!event || typeof event !== "object") return false;

    const metric = event as Record<string, unknown>;

    return (
      typeof metric.eventId === "string" &&
      metric.eventId.trim().length > 0 &&
      typeof metric.sequence === "number" &&
      Number.isSafeInteger(metric.sequence) &&
      metric.sequence > 0 &&
      typeof metric.name === "string" &&
      metric.name.trim().length > 0 &&
      typeof metric.value === "number" &&
      Number.isFinite(metric.value) &&
      (metric.step === undefined ||
        (Number.isInteger(metric.step) && (metric.step as number) >= 0)) &&
      typeof metric.occurredAt === "string" &&
      !Number.isNaN(Date.parse(metric.occurredAt))
    );
  });
}

function getPayloadHash(body: BatchInput): string {
  return createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");
}


export const ingestMetrics: RequestHandler = async (req, res) => {
  try {
    const runId = req.params.runId;

    if (typeof runId !== "string" || !runId.trim()) {
      res.status(400).json({
        success: false,
        message: "Invalid run ID",
      });
      return;
    }

    const projectId = res.locals.projectId;
    const body: unknown = req.body;

    // 1. Validate request body
    if (!validateBatch(body)) {
      res.status(400).json({
        success: false,
        message: "Invalid metric batch payload",
      });
      return;
    }

    const payloadHash = getPayloadHash(body);

    // 2. Start atomic transaction
    const result = await runWithRetry(() =>
  prismaClient.$transaction(
      async (tx) => {
        // Check that the run belongs to the authenticated project
        const run = await tx.run.findFirst({
          where: {
            id: runId,
            projectId,
          },
        });

        if (!run) {
          throw new Error("RUN_NOT_FOUND");
        }

        // Check duplicate batch
        const existingBatch = await tx.ingestionBatch.findUnique({
          where: {
            runId_clientId_batchId: {
              runId,
              clientId: body.clientId,
              batchId: body.batchId,
            },
          },
        });

        if (existingBatch) {
          if (existingBatch.payloadHash !== payloadHash) {
            throw new Error("BATCH_PAYLOAD_CONFLICT");
          }

          return {
            duplicate: true,
            batchId: body.batchId,
            acceptedCount: existingBatch.acceptedCount,
          };
        }

        // 3. Filter duplicate events
        const acceptedEvents: MetricInput[] = [];

        for (const event of body.events) {
          const existingEvent = await tx.metricEvent.findFirst({
            where: {
              runId,
              OR: [
                { eventId: event.eventId },
                {
                  clientId: body.clientId,
                  clientSequence: BigInt(event.sequence),
                },
              ],
            },
          });

          if (!existingEvent) {
            acceptedEvents.push(event);
          }
        }

        // 4. Reserve run sequence numbers atomically
        let nextSequence = run.nextSequence;

        if (acceptedEvents.length > 0) {
          const updatedRun = await tx.run.update({
            where: { id: runId },
            data: {
              nextSequence: {
                increment: BigInt(acceptedEvents.length),
              },
            },
          });

          nextSequence =
            updatedRun.nextSequence - BigInt(acceptedEvents.length);
        }

        // 5. Save metrics and outbox events
        for (const [index, event] of acceptedEvents.entries()) {
          const runSequence = nextSequence + BigInt(index);

          const occurredAt = new Date(event.occurredAt);

          await tx.metricEvent.create({
            data: {
              eventId: event.eventId,
              clientId: body.clientId,
              clientSequence: BigInt(event.sequence),
              runSequence,
              projectId,
              runId,
              name: event.name,
              value: event.value,
              step: event.step,
              occurredAt,
            },
          });

          await tx.outboxEvent.create({
            data: {
              projectId,
              runId,
              runSequence,
              payload: {
                eventId: event.eventId,
                clientId: body.clientId,
                sequence: event.sequence,
                runSequence: runSequence.toString(),
                name: event.name,
                value: event.value,
                step: event.step ?? null,
                occurredAt: occurredAt.toISOString(),
              },
            },
          });
        }

        // 6. Save batch record
        await tx.ingestionBatch.create({
          data: {
            batchId: body.batchId,
            clientId: body.clientId,
            projectId,
            runId,
            payloadHash,
            acceptedCount: acceptedEvents.length,
          },
        });

        return {
          duplicate: false,
          batchId: body.batchId,
          receivedCount: body.events.length,
          acceptedCount: acceptedEvents.length,
          duplicateCount: body.events.length - acceptedEvents.length,
        };
      },
      {
        isolationLevel: "Serializable",
      }
    )
);

    res.status(200).json({
      success: true,
      message: result.duplicate
        ? "Batch already processed"
        : "Metrics ingested successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RUN_NOT_FOUND") {
      res.status(404).json({
        success: false,
        message: "Run not found",
      });
      return;
    }

    if (
      error instanceof Error &&
      error.message === "BATCH_PAYLOAD_CONFLICT"
    ) {
      res.status(409).json({
        success: false,
        message: "Batch ID already used with different payload",
      });
      return;
    }

    console.error("Metric ingestion error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to ingest metrics",
    });
  }
};


async function runWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 8
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isRetryable =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2034";

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(100 * 2 ** (attempt - 1), 2000);
      const jitter = Math.floor(Math.random() * 100);

      await new Promise(resolve =>
        setTimeout(resolve, delay + jitter)
      );
    }
  }

  throw new Error("Transaction retry limit exceeded");
}
