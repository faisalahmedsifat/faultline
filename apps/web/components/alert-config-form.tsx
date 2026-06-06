"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { replaceAlerts, type AlertDto, type AlertChannel } from "@/lib/api"

type Row = {
  key: string
  channel: AlertChannel
  destination: string
  threshold: number
  enabled: boolean
}

const CHANNELS: { value: AlertChannel; label: string }[] = [
  { value: "slack", label: "Slack" },
  { value: "discord", label: "Discord" },
  { value: "email", label: "Email" }
]

let rowCounter = 0

function emptyRow(): Row {
  return { key: `new-${rowCounter++}`, channel: "slack", destination: "", threshold: 10, enabled: true }
}

function alertToRow(alert: AlertDto): Row {
  return { key: alert.id, channel: alert.channel, destination: alert.destination, threshold: alert.threshold, enabled: alert.enabled }
}

export function AlertConfigForm({ projectId, existing }: { projectId: string; existing: AlertDto[] }) {
  const [rows, setRows] = useState<Row[]>(existing.length > 0 ? existing.map(alertToRow) : [emptyRow()])
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const validRows = rows.filter((r) => r.destination.trim())
      await replaceAlerts(projectId, validRows)
      router.refresh()
      setRows(validRows.length > 0 ? validRows.map(alertToRow as (a: unknown) => Row) : [emptyRow()])
      toast.success("Alert configuration saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save alerts")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {rows.map((row, i) => (
        <Card key={row.key}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Channel {i + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
              >
                Remove
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Select
              value={row.channel}
              onValueChange={(v) => updateRow(row.key, { channel: v as AlertChannel })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder={row.channel === "email" ? "dev@example.com" : "https://hooks.slack.com/..."}
              value={row.destination}
              onChange={(e) => updateRow(row.key, { destination: e.target.value })}
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Threshold</span>
              <Input
                type="number"
                min={1}
                max={100000}
                value={row.threshold}
                onChange={(e) => updateRow(row.key, { threshold: Number(e.target.value) || 10 })}
                className="w-20"
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(e) => updateRow(row.key, { enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-muted-foreground">{row.enabled ? "Enabled" : "Disabled"}</span>
            </label>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((prev) => [...prev, emptyRow()])} disabled={rows.length >= 3}>
          Add Channel
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  )
}
