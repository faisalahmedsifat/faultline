import { Queue } from "bullmq"

import { redisConnection } from "./redis"

export const ALERT_DELIVER_QUEUE = "alert.deliver"

export type AlertDeliveryTarget = {
  id: string
  channel: "slack" | "email" | "discord"
  destination: string
}

export type AlertDeliveryJob = {
  projectId: string
  alertTargets: AlertDeliveryTarget[]
  errorId: string
  errorTitle: string
  count: number
  env: string | null
  route: string | null
}

export const alertQueue = new Queue<AlertDeliveryJob>(ALERT_DELIVER_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    },
    removeOnComplete: 100
  }
})

export async function enqueueAlertDelivery(job: AlertDeliveryJob) {
  return alertQueue.add("deliver", job)
}

export async function closeAlertQueue() {
  await alertQueue.close()
}
