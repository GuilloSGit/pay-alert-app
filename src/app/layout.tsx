import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
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
    // og:image generado dinámicamente por opengraph-image.tsx (raíz)
    // y usado como fallback para rutas sin imagen propia
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Pay Alert — Confirmación de pago instantánea' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/assets/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/icon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/assets/icon-180x180.png', sizes: '180x180', type: 'image/png' }],
    other: [
      { rel: 'icon', url: '/assets/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/assets/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground">{children}</body>
    </html>
  )
}
