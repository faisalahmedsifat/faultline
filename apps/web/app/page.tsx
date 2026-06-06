import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Server, Zap, Bell, Activity, ExternalLink } from "lucide-react"
import { TypingTerminal } from "@/components/typing-terminal"

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

const sdks = [
  { name: "JavaScript", icon: "JS" },
  { name: "Python", icon: "PY" },
  { name: "Ruby", icon: "RB" },
  { name: "Go", icon: "GO" },
  { name: "PHP", icon: "PHP" },
  { name: ".NET", icon: ".N" },
  { name: "Java", icon: "JV" },
  { name: "Rust", icon: "RS" }
]

const features = [
  {
    icon: Server,
    title: "Self-Hosted",
    desc: "Your data stays on your server. GDPR-friendly by default. Deploy with one command."
  },
  {
    icon: Zap,
    title: "Zero-Dep SDK",
    desc: "Under 3KB gzipped. Works in Node, Bun, Deno, Edge — anywhere fetch exists."
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    desc: "Slack, Discord, Email. Configurable thresholds per project with rate limiting."
  }
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between animate-fade-in">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="size-4 text-primary" />
          </div>
          <span className="font-semibold text-base tracking-tight">
            fault<span className="text-primary">line</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/faisalahmedsifat/faultline"
            target="_blank"
            rel="noopener"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <GitHubIcon className="size-5" />
          </a>
          <Link href="/projects">
            <Button size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center pt-12 sm:pt-20 pb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm text-xs text-muted-foreground mb-8 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            Open source &middot; Self-hostable &middot; MIT licensed
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.035em] leading-[1.05] mb-5 animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            Production errors,
            <br />
            <span className="bg-gradient-to-r from-primary via-orange-500 to-primary bg-clip-text text-transparent">
              not production bills.
            </span>
          </h1>

          <p
            className="text-muted-foreground max-w-lg mx-auto text-base sm:text-lg leading-relaxed mb-10 animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            A self-hosted error tracker that accepts any Sentry SDK.
            Deploy in one command. No per-event pricing. No surprises.
          </p>

          <div
            className="flex gap-3 justify-center flex-wrap mb-20 animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Link href="/projects">
              <Button size="lg" className="gap-2 px-5 h-10">
                Launch Dashboard
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="https://github.com/faisalahmedsifat/faultline" target="_blank" rel="noopener">
              <Button variant="outline" size="lg" className="gap-2 px-5 h-10">
                <GitHubIcon className="size-4" />
                Star on GitHub
              </Button>
            </a>
          </div>

          {/* Terminal */}
          <div
            className="max-w-lg mx-auto mb-16 animate-fade-up"
            style={{ animationDelay: "0.5s" }}
          >
            <TypingTerminal />
          </div>

          {/* SDK badges */}
          <div
            className="mb-20 animate-fade-up"
            style={{ animationDelay: "0.6s" }}
          >
            <p className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.15em] font-medium mb-4">
              Works with any Sentry SDK
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {sdks.map(({ name, icon }) => (
                <span
                  key={name}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/60 backdrop-blur-sm text-xs font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-default"
                >
                  <span className="text-[10px] font-mono font-bold text-muted-foreground group-hover:text-primary transition-colors">
                    {icon}
                  </span>
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-20">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="group relative border border-border/60 rounded-xl p-6 text-center bg-card/40 backdrop-blur-sm hover:bg-card/80 hover:border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${0.7 + i * 0.1}s` }}
              >
                <div className="size-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-300">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground/50">
          <span>faultline &middot; MIT licensed</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/faisalahmedsifat/faultline"
              target="_blank"
              rel="noopener"
              className="hover:text-muted-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
