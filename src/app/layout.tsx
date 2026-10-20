import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google"

import { AuthProvider } from "@/components/auth-provider"
import { StudioProvider } from "@/components/studio-provider"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Key Assistant",
    template: "%s · Key Assistant",
  },
  description:
    "Make Up Artist, Hijab & Hair Stylist, Decoration, Attire, Photografer & Videografer, dan Content Creator menemukan partner serta jadwal dalam satu tempat.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${jakarta.className} min-h-full bg-background text-foreground`}>
        <AuthProvider>
          <StudioProvider>{children}</StudioProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
