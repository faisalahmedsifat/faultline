import type { Metadata } from "next"
import { Saira } from "next/font/google"
import { Toaster } from "sonner"
import { Sidebar } from "@/components/sidebar"
import { getProjects } from "@/lib/api"
import "./globals.css"

const saira = Saira({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-sans"
})

export const metadata: Metadata = {
  title: "faultline",
  description: "Production errors in one clean inbox."
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let projects: Array<{ id: string; name: string }> = []

  try {
    const data = await getProjects()
    projects = data.projects
  } catch {
    // Sidebar renders empty if API is down
  }

  return (
    <html lang="en" className={`dark ${saira.variable}`}>
      <body className="font-sans antialiased">
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: { background: "#1a1b20", border: "1px solid rgba(255,255,255,0.1)" }
          }}
        />
        <div className="flex min-h-screen">
          <Sidebar projects={projects} />
          <main className="flex-1 min-w-0">
            <div className="md:hidden px-4 pt-4 pb-2 border-b border-border">
              <a href="/" className="font-bold text-sm tracking-tight">
                fault<span className="text-primary">line</span>
              </a>
            </div>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
