import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ReactQueryProvider } from '@/lib/query-client'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: {
    default: 'Pay Alert — Notificaciones de cobros en tiempo real',
    template: '%s | Pay Alert',
  },
  description:
    'Recibí confirmaciones reales de pagos de Mercado Pago en menos de 15 segundos. Tu equipo ve las alertas que vos querés, sin acceso a tu cuenta.',
  metadataBase: new URL('https://pay-alert.com.ar'),
  openGraph: {
    siteName: 'Pay Alert',
    locale: 'es_AR',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Pay Alert — Confirmación de pago instantánea' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
  },
  // PWA
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Pay Alert',
    statusBarStyle: 'black-translucent',
    startupImage: '/icons/icon-512x512.png',
  },
  // icon.tsx y apple-icon.tsx en el app directory generan los link tags automáticamente
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground">
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </body>
    </html>
  )
}
