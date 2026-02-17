import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import PwaRegister from '@/components/PwaRegister'

export const metadata: Metadata = {
  title: 'FitPulse - Votre coach sportif personnel',
  description: 'Programmes personnalisés pour la musculation au poids du corps, avec élastiques et machines. Transformez votre corps avec des séances adaptées à votre niveau.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    title: 'FitPulse',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a56db',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
