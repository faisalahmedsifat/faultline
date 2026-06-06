"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, X, Zap } from "lucide-react"
import { toast } from "sonner"

export function GettingStartedBanner({
  projectId,
  dsn
}: {
  projectId: string
  dsn: string
}) {
  const storageKey = `gs-banner-dismissed-${projectId}`
  const [dismissed, setDismissed] = useState(true)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(localStorage.getItem(storageKey) === "true")
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, "true")
    setDismissed(true)
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("DSN copied")
    setTimeout(() => setCopied(false), 1500)
  }

  if (!mounted || dismissed) return null

  return (
    <div className="relative rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent p-5 mb-5 animate-fade-up overflow-hidden">
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </Button>

      <div className="flex items-center gap-2.5 mb-3">
        <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="size-3.5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Get started in 2 minutes</p>
          <p className="text-xs text-muted-foreground">
            Add the SDK to your app to start tracking errors
          </p>
        </div>
      </div>

      {/* Step 1 */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">1</span>
          <span className="text-xs font-medium">Copy your DSN</span>
        </div>
        <div className="dsn flex items-center justify-between gap-2">
          <code className="text-xs text-primary break-all flex-1">{dsn}</code>
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            onClick={() => handleCopy(dsn)}
            aria-label="Copy DSN"
          >
            {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
          </Button>
        </div>
      </div>

      {/* Step 2 */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">2</span>
          <span className="text-xs font-medium">Add to your app</span>
        </div>
        <pre className="text-xs font-mono bg-code-bg text-code-fg rounded-lg p-3 overflow-x-auto">
          <span className="text-muted-foreground/50">{"// 1. Install: npm install @xyph3r/faultline"}</span>
          {"\n"}
          <span className="text-muted-foreground/50">{"// 2. Add to your app entry point"}</span>
          {"\n"}
          <span className="text-purple-400">import</span> {"{ Faultline }"} <span className="text-purple-400">from</span> <span className="text-amber-300">&quot;@xyph3r/faultline&quot;</span>
          {"\n\n"}
          <span className="text-primary">Faultline</span>.<span className="text-blue-400">init</span>({`{`}
          {"\n  "}dsn: <span className="text-success">&quot;{dsn}&quot;</span>,
          {"\n  "}baseUrl: <span className="text-success">&quot;https://faultline.example.com&quot;</span>
          {"\n}"})
          {"\n\n"}
          <span className="text-muted-foreground/50">{"// 3. Capture errors"}</span>
          {"\n"}
          <span className="text-primary">Faultline</span>.<span className="text-blue-400">capture</span>(error, {"{"} route: <span className="text-success">&quot;/api/checkout&quot;</span> {"}"})
        </pre>
      </div>
    </div>
  )
}
