import type { Metadata } from "next"
import Link from "next/link"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "faultline",
  description: "Production errors in one clean inbox."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: { background: "#1a1b20", border: "1px solid rgba(255,255,255,0.1)" }
          }}
        />
        <nav className="nav-bar">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center h-[52px] gap-4 sm:gap-8">
            <Link href="/projects" className="font-bold text-sm sm:text-base tracking-tight shrink-0">
              fault<span className="text-[#ffb36b]">line</span>
            </Link>
            <div className="flex gap-3 sm:gap-5 text-xs sm:text-sm text-white/60">
              <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
            </div>
          </div>
        </nav>
        <main className="px-4 sm:px-6 pb-12 pt-6 sm:pt-8">
          {children}
        </main>
      </body>
    </html>
  )
}
