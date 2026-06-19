import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pay Alert',
    short_name: 'Pay Alert',
    description: 'Notificaciones verificadas de Mercado Pago en tiempo real',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#040c07',
    theme_color: '#059669',
    orientation: 'portrait-primary',
    lang: 'es-AR',
    categories: ['finance', 'business'],
    icons: [
      // PNGs estáticos (generados con Pillow, campana blanca sobre círculo verde)
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
