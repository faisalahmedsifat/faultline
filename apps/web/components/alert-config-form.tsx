"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { replaceAlerts, type AlertDto, type AlertChannel } from "@/lib/api"

type Row = {
  key: string
  channel: AlertChannel
  destination: string
  threshold: number
  enabled: boolean
}

const CHANNEL_LABELS: Record<AlertChannel, string> = {
  slack: "Slack",
  discord: "Discord",
  email: "Email"
}

let rowCounter = 0

function emptyRow(): Row {
  return {
    key: `new-${rowCounter++}`,
    channel: "slack",
    destination: "",
    threshold: 10,
    enabled: true
  }
}

function alertToRow(alert: AlertDto): Row {
  return {
    key: alert.id,
    channel: alert.channel,
    destination: alert.destination,
    threshold: alert.threshold,
    enabled: alert.enabled
  }
}

export function AlertConfigForm({
  projectId,
  existing
}: {
  projectId: string
  existing: AlertDto[]
}) {
  const [rows, setRows] = useState<Row[]>(
    existing.length > 0 ? existing.map(alertToRow) : [emptyRow()]
  )
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const validRows = rows.filter((r) => r.destination.trim())

    try {
      await replaceAlerts(projectId, validRows)
      router.refresh()
      if (validRows.length > 0) {
        setRows(validRows.map(alertToRow as (a: unknown) => Row))
      } else {
        setRows([emptyRow()])
      }
      toast.success("Alert configuration saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save alerts")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {rows.map((row, i) => (
        <div key={row.key} className="channel-row">
          <div className="channel-row-header">
            <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">
              Channel {i + 1}
            </h4>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => removeRow(row.key)}>
              Remove
            </button>
          </div>

          <div className="channel-fields">
            <select
              className="select"
              value={row.channel}
              onChange={(e) => updateRow(row.key, { channel: e.target.value as AlertChannel })}
            >
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <input
              className="input"
              placeholder={
                row.channel === "email"
                  ? "dev@example.com"
                  : "https://hooks.slack.com/..."
              }
              value={row.destination}
              onChange={(e) => updateRow(row.key, { destination: e.target.value })}
            />

            <div className="flex items-center gap-4">
              <label className="text-sm text-white/60">Threshold</label>
              <input
                className="input max-w-[80px]"
                type="number"
                min={1}
                max={100000}
                value={row.threshold}
                onChange={(e) => updateRow(row.key, { threshold: Number(e.target.value) || 10 })}
              />
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(e) => updateRow(row.key, { enabled: e.target.checked })}
              />
              <span className="toggle-track" />
              <span className="text-sm text-white/60">
                {row.enabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
        </div>
      ))}

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          className="btn"
          onClick={addRow}
          disabled={rows.length >= 3}
        >
          + Add Channel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Alerts"}
        </button>
      </div>
    </form>
  )
}
