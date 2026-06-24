export default async function globalSetup() {
  // Verificar que los servidores necesarios estén corriendo
  const services = [
    { name: 'API (pay-alert-api)', url: 'http://localhost:3001/health' },
    { name: 'App (pay-alert-app)', url: 'http://localhost:3000' },
    { name: 'Admin (pay-alert-admin)', url: 'http://localhost:3003' },
  ]

  for (const svc of services) {
    try {
      const res = await fetch(svc.url, { signal: AbortSignal.timeout(3000) })
      if (!res.ok && svc.url.includes('health')) {
        throw new Error(`HTTP ${res.status}`)
      }
      console.log(`  ✅ ${svc.name} — corriendo`)
    } catch {
      console.error(`  ❌ ${svc.name} no responde en ${svc.url}`)
      console.error(`     Levantar con: npm run dev (en el directorio correspondiente)`)
      if (svc.name.includes('API') || svc.name.includes('App')) {
        throw new Error(`Servicio requerido no disponible: ${svc.name}`)
      }
      // Admin es opcional para los tests de la app
      console.warn(`     [WARN] Admin no disponible — los tests de admin serán skipped`)
    }
  }

  console.log('🎭 Playwright E2E — Setup completado\n')
}
