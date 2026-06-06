import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Server, Zap, Bell } from "lucide-react"

const features = [
  {
    icon: Server,
    title: "Self-Hosted",
    desc: "Your data stays on your server. GDPR-friendly by default."
  },
  {
    icon: Zap,
    title: "Zero-Dep SDK",
    desc: "Under 3KB. Works in Node, Bun, Deno, Edge — anywhere fetch exists."
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    desc: "Slack, Discord, Email. Configurable thresholds per project."
  }
]

export default function LandingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-20 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 text-xs text-muted-foreground mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Open source & self-hostable
      </div>

      <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] leading-[0.96] mb-4">
        Production errors,
        <br />
        <span className="text-primary">not production bills.</span>
      </h1>

      <p className="text-muted-foreground max-w-xl mx-auto text-lg mb-8">
        A self-hosted error tracker that accepts any Sentry SDK. Deploy in one
        command. No per-event pricing. No surprises.
      </p>

      <div className="flex gap-3 justify-center flex-wrap mb-20">
        <Link href="/projects">
          <Button size="lg">
            Launch Dashboard <ArrowRight className="ml-1 size-4" />
          </Button>
        </Link>
        <a href="https://github.com/faisalahmedsifat/faultline" target="_blank" rel="noopener">
          <Button variant="outline" size="lg">GitHub</Button>
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-20">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="border border-border rounded-xl p-6 text-center">
            <Icon className="size-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        faultline · MIT licensed
      </p>
    </div>
  )
}
