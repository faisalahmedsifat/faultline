import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "faultline",
  description: "Production errors in one clean inbox."
}

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

