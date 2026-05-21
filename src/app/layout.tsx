import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Pay Alert — Notificaciones de cobros en tiempo real',
  description: 'Recibí alertas instantáneas de tus cobros con Mercado Pago',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground">{children}</body>
    </html>
  )
}
