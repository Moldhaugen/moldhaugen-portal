import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Moldhaugen Portal",
  description: "Nabolagsportalen for Moldhaugen Borettslag",
  appleWebApp: { capable: true, title: "Moldhaugen", statusBarStyle: "black-translucent" },
  manifest: "/manifest.json",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="no" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1e293b" />
        <link rel="apple-touch-icon" sizes="180x180" href="/api/icons/pwa/apple" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </head>
      <body className="h-full antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
