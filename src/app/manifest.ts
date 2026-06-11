import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pay Alert',
    short_name: 'Pay Alert',
    description: 'Notificaciones verificadas de Mercado Pago en tiempo real',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f8faf9',
    theme_color: '#059669',
    lang: 'es-AR',
    icons: [
      // SVG — mejor calidad en Chrome moderno
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      // PNG fallbacks para Safari y browsers antiguos
      { src: '/assets/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/assets/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
