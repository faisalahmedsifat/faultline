import { QueueEvents, Worker, type Job } from "bullmq"

import { env } from "./env"
import { logger } from "./logger"
import { processAlertDelivery } from "./processor"
import { closeRedis, connectRedis, createRedisConnection, waitForConnection } from "./redis"
import type { AlertDeliveryJob } from "./types"

const ALERT_DELIVER_QUEUE = "alert.deliver"

async function start() {
  await connectRedis()

  const workerConnection = createRedisConnection()
  const eventsConnection = createRedisConnection()
  await waitForConnection(workerConnection)
  await waitForConnection(eventsConnection)

  const worker = new Worker<AlertDeliveryJob>(
    ALERT_DELIVER_QUEUE,
    async (job) => {
      await processAlertDelivery(job)
    },
    {
      connection: workerConnection,
      concurrency: 10,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 } // keep failed jobs for inspection
    }
  )

  const queueEvents = new QueueEvents(ALERT_DELIVER_QUEUE, {
    connection: eventsConnection
  })

  worker.on("ready", () => {
    logger.info("worker.started", {
      queue: ALERT_DELIVER_QUEUE,
      nodeEnv: env.NODE_ENV
    })
  })

  worker.on("completed", (job: Job<AlertDeliveryJob>) => {
    logger.info("worker.job_completed", {
      jobId: job.id,
      errorId: job.data.errorId
    })
  })

  worker.on("failed", (job: Job<AlertDeliveryJob> | undefined, error: Error) => {
    logger.error("worker.job_failed", {
      jobId: job?.id ?? null,
      errorId: job?.data.errorId ?? null,
      attemptsMade: job?.attemptsMade ?? 0,
      message: error.message
    })
  })

  queueEvents.on("waiting", ({ jobId }: { jobId: string }) => {
    logger.info("worker.job_waiting", { jobId })
  })

  const shutdown = async (signal: string) => {
    logger.info("worker.shutdown", { signal })
    await queueEvents.close()
    await worker.close()
    await eventsConnection.quit()
    await workerConnection.quit()
    await closeRedis()
    process.exit(0)
  }

  process.on("SIGINT", () => {
    void shutdown("SIGINT")
  })

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM")
  })
}

start().catch((error) => {
  logger.error("worker.start_failed", {
    message: error instanceof Error ? error.message : "Unknown startup error"
  })
  process.exit(1)
})
