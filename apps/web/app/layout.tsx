import type { Metadata } from "next"
import { Saira } from "next/font/google"
import { Toaster } from "sonner"
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={saira.variable}>
      <body className="font-sans antialiased">
        <Toaster
          position="bottom-right"
        />
        {children}
      </body>
    </html>
  )
}
