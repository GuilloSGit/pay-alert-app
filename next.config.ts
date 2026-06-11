import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Standalone output para Docker — genera .next/standalone/ auto-contenido
  output: 'standalone',
  // Proxy server-side hacia el backend. Usa API_URL (sin NEXT_PUBLIC_) para no
  // exponer la URL interna al bundle del cliente. Next.js evalúa rewrites en
  // runtime al arrancar el servidor, por lo que API_URL puede cambiarse por env var
  // sin rebuildar la imagen.
  async rewrites() {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
    return [{ source: '/api/v1/:path*', destination: `${apiUrl}/api/v1/:path*` }]
  },
}

export default nextConfig
