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
      // Generado dinámicamente por src/app/icon.tsx (campana verde)
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
