import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { BackgroundEffects } from "@/components/layout/BackgroundEffects"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Birdie",
  description: "Professional badminton match scoring and management system",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BackgroundEffects />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
