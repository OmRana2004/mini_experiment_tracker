-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "projectId" UUID NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'RUNNING',
    "projectId" UUID NOT NULL,
    "nextSequence" BIGINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricEvent" (
    "id" UUID NOT NULL,
    "eventId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projectId" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "clientSequence" BIGINT NOT NULL,
    "runSequence" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "step" INTEGER,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "MetricEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionBatch" (
    "id" UUID NOT NULL,
    "batchId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projectId" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "acceptedCount" INTEGER NOT NULL DEFAULT 0,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "runSequence" BIGINT NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_projectId_idx" ON "ApiKey"("projectId");

-- CreateIndex
CREATE INDEX "Run_projectId_createdAt_idx" ON "Run"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Run_id_projectId_key" ON "Run"("id", "projectId");

-- CreateIndex
CREATE INDEX "MetricEvent_projectId_runId_runSequence_idx" ON "MetricEvent"("projectId", "runId", "runSequence");

-- CreateIndex
CREATE UNIQUE INDEX "MetricEvent_runId_eventId_key" ON "MetricEvent"("runId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricEvent_runId_clientId_clientSequence_key" ON "MetricEvent"("runId", "clientId", "clientSequence");

-- CreateIndex
CREATE UNIQUE INDEX "MetricEvent_runId_runSequence_key" ON "MetricEvent"("runId", "runSequence");

-- CreateIndex
CREATE UNIQUE INDEX "IngestionBatch_runId_clientId_batchId_key" ON "IngestionBatch"("runId", "clientId", "batchId");

-- CreateIndex
CREATE INDEX "OutboxEvent_publishedAt_nextAttemptAt_idx" ON "OutboxEvent"("publishedAt", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_runId_runSequence_key" ON "OutboxEvent"("runId", "runSequence");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricEvent" ADD CONSTRAINT "MetricEvent_runId_projectId_fkey" FOREIGN KEY ("runId", "projectId") REFERENCES "Run"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionBatch" ADD CONSTRAINT "IngestionBatch_runId_projectId_fkey" FOREIGN KEY ("runId", "projectId") REFERENCES "Run"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_runId_projectId_fkey" FOREIGN KEY ("runId", "projectId") REFERENCES "Run"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;
