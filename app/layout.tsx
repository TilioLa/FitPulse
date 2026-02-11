import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'FitPulse - Votre coach sportif personnel',
  description: 'Programmes personnalisés pour la musculation au poids du corps, avec élastiques et machines. Transformez votre corps avec des séances adaptées à votre niveau.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
