import type { Metadata } from 'next'
import { Outfit, Noto_Sans_SC, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'DashGen – AI-Powered BI Dashboard Generator',
  description: 'Describe your metrics, get a beautiful BI dashboard in 30 seconds. Powered by AI.',
  keywords: ['BI dashboard', 'data visualization', 'AI report generator', 'analytics'],
  openGraph: {
    title: 'DashGen – AI BI Dashboard Generator',
    description: 'Generate professional dashboards from your metrics in seconds.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${notoSansSC.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
