import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Script from "next/script"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Moldhaugen Portal",
  description: "Nabolagsportalen for Moldhaugen Borettslag",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Moldhaugen", statusBarStyle: "black-translucent" },
  icons: { apple: "/api/icons/pwa/apple" },
}

export const viewport: Viewport = {
  themeColor: "#1e293b",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="no" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="h-full antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <Script id="sw-register" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').then(r=>console.log('SW registered',r.scope)).catch(e=>console.error('SW failed',e))}`}
        </Script>
      </body>
    </html>
  )
}
