'use client'

import { useState } from 'react'
import { PageShell } from '@/components/layout/PageShell'

interface Section {
  id: string
  icon: React.ReactNode
  title: string
  content: React.ReactNode
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 flex-shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

const SECTIONS: Section[] = [
  {
    id: 'exportar',
    icon: (
      <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: 'No puedo exportar archivos (CSV, Excel, PDF)',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          El navegador puede bloquear las descargas automáticas si en algún momento rechazaste un permiso. Seguí estos pasos según tu navegador:
        </p>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Chrome / Edge</p>
            <ol className="space-y-1.5 text-sm text-muted">
              <li>1. Hacé clic en el candado 🔒 a la izquierda de la URL</li>
              <li>2. Seleccioná <strong className="text-foreground">Permisos del sitio</strong></li>
              <li>3. Buscá <strong className="text-foreground">Descargas automáticas</strong> y cambialo a <strong className="text-foreground">Permitir</strong></li>
              <li>4. Recargá la página</li>
            </ol>
            <p className="mt-2 text-xs text-muted">
              O ingresá directo a <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">chrome://settings/content/automaticDownloads</code> y agregá <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">pay-alert.com.ar</code>
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Safari</p>
            <ol className="space-y-1.5 text-sm text-muted">
              <li>1. Menú <strong className="text-foreground">Safari</strong> → <strong className="text-foreground">Configuración</strong> (⌘,)</li>
              <li>2. Pestaña <strong className="text-foreground">Sitios web</strong> → <strong className="text-foreground">Descargas</strong></li>
              <li>3. Buscá <strong className="text-foreground">pay-alert.com.ar</strong> y cambialo a <strong className="text-foreground">Permitir</strong></li>
            </ol>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Firefox</p>
            <ol className="space-y-1.5 text-sm text-muted">
              <li>1. Hacé clic en el candado 🔒 a la izquierda de la URL</li>
              <li>2. <strong className="text-foreground">Limpiar cookies y datos del sitio</strong> no es necesario — solo buscá <strong className="text-foreground">Permisos</strong></li>
              <li>3. En <strong className="text-foreground">Preferencias</strong> → <strong className="text-foreground">General</strong> → <strong className="text-foreground">Descargas</strong>, verificá que no esté bloqueado</li>
            </ol>
          </div>
        </div>

        <p className="text-xs text-muted">
          Si el problema persiste, intentá desde una ventana de incógnito para descartar extensiones del navegador.
        </p>
      </div>
    ),
  },
  {
    id: 'dispositivo',
    icon: (
      <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Modal "Dispositivo ya vinculado"',
    content: (
      <div className="space-y-3 text-sm text-muted">
        <p>
          Este mensaje aparece cuando iniciás sesión desde un nuevo navegador o dispositivo y ya tenés otro activo con notificaciones push configuradas.
        </p>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">→</span>
            <span><strong className="text-foreground">Usar este dispositivo</strong>: activa las notificaciones push en el dispositivo actual y desactiva el anterior.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-muted">→</span>
            <span><strong className="text-foreground">Cancelar</strong>: seguís sin notificaciones push en este dispositivo (podés activarlas después desde Configuración).</span>
          </li>
        </ul>
        <p>
          Podés ver y desconectar dispositivos desde{' '}
          <a href="/dashboard/settings" className="font-medium text-primary underline-offset-2 hover:underline">
            Configuración → Dispositivos
          </a>.
        </p>
      </div>
    ),
  },
  {
    id: 'notificaciones',
    icon: (
      <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: 'No recibo notificaciones push',
    content: (
      <div className="space-y-4 text-sm text-muted">
        <p>Las notificaciones requieren tres condiciones: permiso del navegador, dispositivo vinculado y Mercado Pago conectado.</p>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 font-semibold text-foreground">1. Verificar permiso del navegador</p>
            <p className="mb-2">El navegador debe tener permitidas las notificaciones para este sitio:</p>
            <ul className="space-y-1">
              <li><strong className="text-foreground">Chrome/Edge:</strong> candado 🔒 en la URL → Notificaciones → Permitir</li>
              <li><strong className="text-foreground">Safari (macOS):</strong> Safari → Configuración → Sitios web → Notificaciones → pay-alert.com.ar → Permitir</li>
              <li><strong className="text-foreground">Firefox:</strong> candado 🔒 → Permisos → Notificaciones → Permitir</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 font-semibold text-foreground">2. Verificar que el dispositivo está vinculado</p>
            <p>
              Ir a{' '}
              <a href="/dashboard/settings" className="font-medium text-primary underline-offset-2 hover:underline">
                Configuración → Dispositivos
              </a>{' '}
              y verificar que aparezca el dispositivo actual como activo. Si no está, activar notificaciones desde ahí.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 font-semibold text-foreground">3. Verificar conexión con Mercado Pago</p>
            <p>
              Sin una cuenta MP conectada no hay pagos que notificar. Verificar el estado en{' '}
              <a href="/dashboard/businesses" className="font-medium text-primary underline-offset-2 hover:underline">
                Mi Comercio
              </a>.
            </p>
          </div>
        </div>

        <p className="text-xs">
          Podés enviar una notificación de prueba desde Configuración → Dispositivos → Probar.
        </p>
      </div>
    ),
  },
  {
    id: 'mercadopago',
    icon: (
      <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: 'Conectar o reconectar Mercado Pago',
    content: (
      <div className="space-y-3 text-sm text-muted">
        <p>
          Pay Alert se conecta con tu cuenta de Mercado Pago mediante OAuth — nunca accede a tu contraseña ni puede mover dinero.
        </p>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
          <p className="font-semibold">La conexión puede interrumpirse si:</p>
          <ul className="mt-1 space-y-1 text-amber-700">
            <li>• Cambiaste la contraseña de MP</li>
            <li>• Revocaste el acceso desde la app de MP</li>
            <li>• El token de autorización expiró (más de 180 días sin actividad)</li>
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-2 font-semibold text-foreground">Para reconectar:</p>
          <ol className="space-y-1.5">
            <li>1. Ir a <a href="/dashboard/businesses" className="font-medium text-primary underline-offset-2 hover:underline">Mi Comercio</a></li>
            <li>2. En el banner naranja, hacer clic en <strong className="text-foreground">Reconectar</strong></li>
            <li>3. Serás redirigido a Mercado Pago para autorizar</li>
            <li>4. Al completar, volvés automáticamente a Pay Alert</li>
          </ol>
        </div>

        <p className="text-xs">
          Si tenés múltiples cuentas de MP, asegurate de autorizar con la cuenta que recibe los pagos de este comercio.
        </p>
      </div>
    ),
  },
  {
    id: 'roles',
    icon: (
      <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Roles y permisos — qué puede hacer cada uno',
    content: (
      <div className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-semibold text-muted">Acción</th>
                <th className="px-2 py-2 text-center font-semibold text-foreground">Dueño</th>
                <th className="px-2 py-2 text-center font-semibold text-foreground">Admin</th>
                <th className="px-2 py-2 text-center font-semibold text-foreground">Empleado</th>
                <th className="px-2 py-2 text-center font-semibold text-foreground">Obs.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted">
              {[
                ['Ver pagos y cierres', '✅', '✅', '✅', '✅'],
                ['Exportar pagos/cierres', '✅', '✅', '✅', '❌'],
                ['Recibir email de cierre', '✅', '✅', 'Config.¹', '❌'],
                ['Configurar alertas push', '✅', '✅', 'Config.¹', '❌'],
                ['Conectar/desconectar MP', '✅', 'Config.²', '❌', '❌'],
                ['Invitar miembros', '✅', '✅', '❌', '❌'],
                ['Gestionar suscripción', '✅', '❌', '❌', '❌'],
              ].map(([action, ...perms]) => (
                <tr key={action}>
                  <td className="py-2 pr-4 text-foreground">{action}</td>
                  {perms.map((p, i) => (
                    <td key={i} className="px-2 py-2 text-center">{p}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">
          ¹ El Dueño puede habilitar o deshabilitar estas opciones para Empleados en{' '}
          <a href="/dashboard/settings" className="font-medium text-primary underline-offset-2 hover:underline">Configuración → Roles</a>.
        </p>
        <p className="text-xs text-muted">
          ² El Dueño puede permitir que Admins conecten/desconecten MP en Configuración → Roles.
        </p>
      </div>
    ),
  },
]

function AccordionItem({ section }: { section: Section }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {section.icon}
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground">{section.title}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4">
          {section.content}
        </div>
      )}
    </div>
  )
}

export default function AyudaPage() {
  return (
    <PageShell title="Ayuda">
      <div className="space-y-6">
        <p className="text-sm text-muted">
          Encontrá respuestas a los problemas más comunes. Si no encontrás lo que buscás, usá <strong className="text-foreground">Reportar un problema</strong> en el menú lateral y lo resolvemos.
        </p>

        <div className="space-y-3">
          {SECTIONS.map((section) => (
            <AccordionItem key={section.id} section={section} />
          ))}
        </div>
      </div>
    </PageShell>
  )
}
