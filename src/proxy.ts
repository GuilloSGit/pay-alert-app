import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register']

// En Next.js 16 el archivo de middleware se llama proxy.ts y exporta `proxy`.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // pa_session=1 es un indicador no sensible seteado por el FE al hacer login.
  // La seguridad real la provee la httpOnly cookie `refresh_token` del backend.
  const hasSession = request.cookies.has('pa_session')

  // La raíz es la landing page pública — siempre accesible.
  if (pathname === '/') return NextResponse.next()

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|icon\\.svg|manifest\\.webmanifest|opengraph-image|assets|api).*)'],
}
