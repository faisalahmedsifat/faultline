import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: "faultline",
  description: "Production errors in one clean inbox."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <nav className="nav-bar">
          <div className="max-w-4xl mx-auto px-6 flex items-center h-[52px] gap-8">
            <Link href="/projects" className="font-bold text-base tracking-tight">
              fault<span className="text-[#ffb36b]">line</span>
            </Link>
            <div className="flex gap-5 text-sm text-white/60">
              <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
            </div>
          </div>
        </nav>
        <main className="px-6 pb-12 pt-8">
          {children}
        </main>
      </body>
    </html>
  )
}
