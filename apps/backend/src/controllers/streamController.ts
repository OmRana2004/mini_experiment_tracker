
import type { RequestHandler } from "express";
import { prismaClient } from "@repo/db/client";

export const streamRunEvents: RequestHandler = async (req, res) => {
  const runId = req.params.runId;
  const projectId = res.locals.projectId;

  if (typeof runId !== "string" || !runId.trim()) {
    res.status(400).json({
      success: false,
      message: "Invalid run ID",
    });
    return;
  }

  try {
    // Verify that this run belongs to the authenticated project.
    const run = await prismaClient.run.findFirst({
      where: {
        id: runId,
        projectId,
      },
    });

    if (!run) {
      res.status(404).json({
        success: false,
        message: "Run not found",
      });
      return;
    }

    // Read the last event received by the browser.
   const lastEventId = req.get("Last-Event-ID") ?? "0";

    if (!/^\d+$/.test(lastEventId)) {
      res.status(400).json({
        success: false,
        message: "Invalid Last-Event-ID",
      });
      return;
    }

    let lastSequence = BigInt(lastEventId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders();

    res.write(
      `event: connected\ndata: ${JSON.stringify({
        message: "SSE connected",
      })}\n\n`
    );

    let isClosed = false;
    let isPolling = false;
    let timer: ReturnType<typeof setInterval>;

    const cleanup = () => {
      isClosed = true;
      clearInterval(timer);
    };

    req.on("close", cleanup);

    const sendEvents = async () => {
      if (isClosed || isPolling) return;

      isPolling = true;

      try {
        const events = await prismaClient.outboxEvent.findMany({
          where: {
            projectId,
            runId,
            runSequence: {
              gt: lastSequence,
            },
          },
          orderBy: {
            runSequence: "asc",
          },
          take: 100,
        });

        for (const event of events) {
          if (isClosed) break;

          const payload = JSON.stringify(event.payload);

          const canContinue = res.write(
            `id: ${event.runSequence.toString()}\n` +
            `event: metric\n` +
            `data: ${payload}\n\n`
          );

          lastSequence = event.runSequence;

          if (!canContinue) {
            // Pause polling while the response buffer is full.
            await new Promise<void>((resolve) => {
              res.once("drain", resolve);
              res.once("close", resolve);
            });
          }
        }
      } catch (error) {
        console.error("SSE event streaming error:", error);
      } finally {
        isPolling = false;
      }
    };

    // Send existing missed events immediately
    await sendEvents();

    // Check for new events every second.
    timer = setInterval(() => {
      void sendEvents();
    }, 1000);

  } catch (error) {
    console.error("SSE connection error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to establish SSE connection",
      });
    } else {
      res.end();
    }
  }
};
