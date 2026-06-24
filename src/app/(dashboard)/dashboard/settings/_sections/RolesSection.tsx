'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { useActiveBusiness } from '@/lib/business-context'
import type { ApiResponse } from '@/types'

interface BusinessPermissions {
  memberCanReceiveClosures: boolean
  memberCanConfigureAlerts: boolean
  adminCanConnectMP: boolean
}

type PermissionKey = keyof BusinessPermissions

interface PermissionRow {
  label: string
  description: string
  owner: boolean | 'fixed'
  admin: boolean | 'fixed' | PermissionKey
  member: boolean | 'fixed' | PermissionKey
  observer: boolean | 'fixed'
}

const PERMISSIONS: PermissionRow[] = [
  {
    label: 'Ver pagos',
    description: 'Acceso al historial de pagos del comercio',
    owner: 'fixed',
    admin: 'fixed',
    member: 'fixed',
    observer: 'fixed',
  },
  {
    label: 'Generar cierre',
    description: 'Puede consultar y generar resúmenes de cierre',
    owner: 'fixed',
    admin: 'fixed',
    member: 'fixed',
    observer: false,
  },
  {
    label: 'Exportar cierres',
    description: 'Puede descargar cierres en CSV, Excel o PDF (requiere plan Profesional)',
    owner: 'fixed',
    admin: 'fixed',
    member: 'fixed',
    observer: false,
  },
  {
    label: 'Recibir email de cierre',
    description: 'Recibe el resumen de pagos nocturno por email',
    owner: 'fixed',
    admin: 'fixed',
    member: 'memberCanReceiveClosures',
    observer: false,
  },
  {
    label: 'Configurar alertas',
    description: 'Puede editar el monto mínimo de notificación push',
    owner: 'fixed',
    admin: 'fixed',
    member: 'memberCanConfigureAlerts',
    observer: false,
  },
  {
    label: 'Conectar MP',
    description: 'Puede vincular o desvincular la cuenta de MercadoPago',
    owner: 'fixed',
    admin: 'adminCanConnectMP',
    member: false,
    observer: false,
  },
  {
    label: 'Gestionar suscripción',
    description: 'Puede cambiar el plan y gestionar la suscripción',
    owner: 'fixed',
    admin: false,
    member: false,
    observer: false,
  },
  {
    label: 'Invitar miembros',
    description: 'Puede enviar y cancelar invitaciones',
    owner: 'fixed',
    admin: 'fixed',
    member: false,
    observer: false,
  },
]

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={[
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        checked ? 'bg-emerald-500' : 'bg-gray-200',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

function Cell({
  value,
  perms,
  onToggle,
  saving,
}: {
  value: boolean | 'fixed' | PermissionKey
  perms: BusinessPermissions | undefined
  onToggle: (key: PermissionKey, val: boolean) => void
  saving: boolean
}) {
  if (value === 'fixed') {
    return (
      <td className="px-3 py-3 text-center">
        <div className="flex justify-center">
          <CheckIcon />
        </div>
      </td>
    )
  }
  if (value === false) {
    return (
      <td className="px-3 py-3 text-center">
        <div className="flex justify-center">
          <CrossIcon />
        </div>
      </td>
    )
  }
  // toggleable
  const key = value as PermissionKey
  const checked = perms?.[key] ?? false
  return (
    <td className="px-3 py-3 text-center">
      <div className="flex justify-center">
        <Toggle checked={checked} onChange={(v) => onToggle(key, v)} disabled={saving || !perms} />
      </div>
    </td>
  )
}

const COLS = ['OWNER', 'ADMIN', 'MEMBER', 'OBSERVER']

export function RolesSection() {
  const { businessId } = useActiveBusiness()
  const queryClient = useQueryClient()

  const { data: perms, isLoading } = useQuery({
    queryKey: ['business-permissions', businessId],
    queryFn: () =>
      api
        .get<ApiResponse<BusinessPermissions>>(`/api/v1/businesses/${businessId}/permissions`)
        .then((r) => r.data),
    enabled: !!businessId,
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: (patch: Partial<BusinessPermissions>) =>
      api
        .put<ApiResponse<BusinessPermissions>>(`/api/v1/businesses/${businessId}/permissions`, patch)
        .then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['business-permissions', businessId], data)
    },
  })

  function handleToggle(key: PermissionKey, value: boolean) {
    mutation.mutate({ [key]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permisos por rol</CardTitle>
        <CardDescription>
          Configurá qué puede hacer cada rol dentro de este comercio.
        </CardDescription>
      </CardHeader>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner size="sm" />
          <span className="text-sm text-muted">Cargando...</span>
        </div>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-foreground">Permiso</th>
                {COLS.map((col) => (
                  <th key={col} className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PERMISSIONS.map((row) => (
                <tr key={row.label} className="hover:bg-gray-50/50">
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground">{row.label}</p>
                    <p className="text-xs text-muted">{row.description}</p>
                  </td>
                  {(['owner', 'admin', 'member', 'observer'] as const).map((col) => (
                    <Cell
                      key={col}
                      value={row[col]}
                      perms={perms}
                      onToggle={handleToggle}
                      saving={mutation.isPending}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mutation.isError && (
        <p className="mt-3 text-xs text-red-600">No se pudo guardar. Intentá de nuevo.</p>
      )}
    </Card>
  )
}
