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

