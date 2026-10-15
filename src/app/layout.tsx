import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Fraunces, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google"

import { StudioProvider } from "@/components/studio-provider"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Riasaja",
    template: "%s · Riasaja",
  },
  description:
    "Meja kerja untuk studio MUA: jadwal anti-bentrok, invoice, DP, gaun, dan pricelist bio Instagram.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <StudioProvider>{children}</StudioProvider>
      </body>
    </html>
  )
}
