"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StatsDto } from "@/lib/api"

interface ErrorChartProps {
  projectId: string
  className?: string
}

function useStats(projectId: string) {
  const [data, setData] = useState<StatsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      setLoading(true)
      setError(null)
      try {
        const { getProjectStats } = await import("@/lib/api")
        const result = await getProjectStats(projectId)
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stats")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()
    return () => { cancelled = true }
  }, [projectId])

  return { data, loading, error }
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function ErrorChart({ projectId, className }: ErrorChartProps) {
  const { data, loading, error } = useStats(projectId)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  const measure = useCallback(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth)
    }
  }, [])

  useEffect(() => {
    measure()
    const obs = new ResizeObserver(measure)
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [measure])

  const chartHeight = 140
  const barGap = 1
  const paddingX = 2
  const paddingTop = 4
  const paddingBottom = 20

  if (loading) {
    return (
      <div className={cn("bg-card border border-border rounded-xl p-5", className)}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="size-4 text-muted-foreground" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-36 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("bg-card border border-border rounded-xl p-5", className)}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Error Volume — Last 30 Days</span>
        </div>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const dailyCounts = [...data.dailyCounts].reverse()
  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1)
  const barAreaWidth = width - paddingX * 2
  const barWidth = Math.max((barAreaWidth - barGap * (dailyCounts.length - 1)) / dailyCounts.length, 1)
  const barAreaHeight = chartHeight - paddingTop - paddingBottom

  return (
    <div className={cn("bg-card border border-border rounded-xl p-5", className)}>
      {/* Header with total */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Error Volume — Last 30 Days</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total
          </span>
          <span className="text-xl font-bold tabular-nums">
            {data.totals.total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="w-full">
        <svg
          width={width}
          height={chartHeight}
          className="block"
          role="img"
          aria-label="Daily error volume chart for the last 30 days"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((frac) => (
            <line
              key={frac}
              x1={paddingX}
              x2={width - paddingX}
              y1={paddingTop + barAreaHeight * (1 - frac)}
              y2={paddingTop + barAreaHeight * (1 - frac)}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.5}
              strokeDasharray="3 3"
            />
          ))}

          {/* Bars */}
          {dailyCounts.map((day, i) => {
            const barHeight = maxCount > 0
              ? Math.max((day.count / maxCount) * barAreaHeight, day.count > 0 ? 2 : 0)
              : 0
            const x = paddingX + i * (barWidth + barGap)
            const y = paddingTop + barAreaHeight - barHeight

            return (
              <g key={day.date}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={barWidth < 3 ? 0.5 : 1}
                  className={cn(
                    day.count > 0
                      ? "fill-destructive/70 hover:fill-destructive transition-colors"
                      : "fill-muted/30"
                  )}
                >
                  <title>
                    {formatDate(day.date)}: {day.count} {day.count === 1 ? "error" : "errors"}
                  </title>
                </rect>
              </g>
            )
          })}

          {/* X-axis labels (show every 5th day) */}
          {dailyCounts.map((day, i) => {
            if (i % 5 !== 0 && i !== dailyCounts.length - 1) return null
            const x = paddingX + i * (barWidth + barGap) + barWidth / 2
            return (
              <text
                key={`label-${day.date}`}
                x={x}
                y={chartHeight - 2}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={10}
              >
                {formatDate(day.date)}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Empty state */}
      {data.totals.total === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          No errors recorded in the last 30 days
        </p>
      )}
    </div>
  )
}
