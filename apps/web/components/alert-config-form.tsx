"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { replaceAlerts, type AlertDto, type AlertChannel } from "@/lib/api"
import { Plus, Trash2, MessageSquare, Mail, Hash } from "lucide-react"

type Row = {
  key: string
  channel: AlertChannel
  destination: string
  threshold: number
  enabled: boolean
}

const CHANNELS: { value: AlertChannel; label: string; icon: typeof MessageSquare; placeholder: string }[] = [
  { value: "slack", label: "Slack", icon: MessageSquare, placeholder: "https://hooks.slack.com/services/..." },
  { value: "discord", label: "Discord", icon: Hash, placeholder: "https://discord.com/api/webhooks/..." },
  { value: "email", label: "Email", icon: Mail, placeholder: "team@example.com" }
]

let rowCounter = 0

function emptyRow(): Row {
  return { key: `new-${rowCounter++}`, channel: "slack", destination: "", threshold: 10, enabled: true }
}

function alertToRow(alert: AlertDto): Row {
  return { key: alert.id, channel: alert.channel, destination: alert.destination, threshold: alert.threshold, enabled: alert.enabled }
}

function getChannelConfig(channel: AlertChannel) {
  return CHANNELS.find(c => c.value === channel) ?? CHANNELS[0]
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {rows.map((row) => {
        const config = getChannelConfig(row.channel)
        const Icon = config.icon
        return (
          <Card key={row.key} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Channel header */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="size-7 rounded-lg bg-card border border-border flex items-center justify-center">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <Select
                    value={row.channel}
                    onValueChange={(v) => updateRow(row.key, { channel: v as AlertChannel })}
                  >
                    <SelectTrigger className="h-7 w-[100px] border-0 bg-transparent text-sm font-medium shadow-none px-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) => updateRow(row.key, { enabled: e.target.checked })}
                      className="rounded accent-primary"
                    />
                    <span className="text-muted-foreground">
                      {row.enabled ? "Active" : "Paused"}
                    </span>
                  </label>
                  <Separator orientation="vertical" className="h-4 mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                    aria-label="Remove channel"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Channel config */}
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {row.channel === "email" ? "Email Address" : "Webhook URL"}
                  </label>
                  <Input
                    placeholder={config.placeholder}
                    value={row.destination}
                    onChange={(e) => updateRow(row.key, { destination: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Threshold
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100000}
                      value={row.threshold}
                      onChange={(e) => updateRow(row.key, { threshold: Number(e.target.value) || 10 })}
                      className="w-24 tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">
                      errors in a 15-minute window
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
          disabled={rows.length >= 3}
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          Add Channel
        </Button>
        <Button type="submit" size="sm" disabled={saving} className="min-w-[80px]">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        Up to 3 alert channels per project. Alerts fire when error count exceeds the threshold within a 15-minute window.
      </p>
    </form>
  )
}
