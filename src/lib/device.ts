import { tryGetPushCredentials, getDeviceName } from './push'
import { api, ApiError } from './api'

function computeFingerprint(): string {
  const signals = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    String(new Date().getTimezoneOffset()),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? ''),
  ]
  return signals.join('|')
}

export interface DeviceLimitInfo {
  platform: string | null
  deviceName: string | null
  lastSeenAt: string | null
}

export interface RegisterDeviceResult {
  ok: true
  replaced?: boolean
}

export type RegisterDeviceError =
  | { type: 'DEVICE_LIMIT_REACHED'; currentDevice: DeviceLimitInfo | null }
  | { type: 'ERROR' }

// Registra el dispositivo con credenciales push incluidas en una sola llamada a la API.
// Pedir permiso de notificaciones y registrar el device son el mismo paso para evitar
// consumir el slot del límite de dispositivos con un device sin push.
export async function registerDevice(
  opts: { force?: boolean } = {},
): Promise<RegisterDeviceResult | RegisterDeviceError> {
  const fingerprint = computeFingerprint()
  const deviceName = getDeviceName()

  const pushCreds = await tryGetPushCredentials()

  try {
    await api.post('/api/v1/users/me/devices', {
      platform: 'web',
      fingerprint,
      deviceName,
      ...(pushCreds ?? {}),
      ...(opts.force ? { force: true } : {}),
    })
    return { ok: true, replaced: opts.force }
  } catch (err) {
    if (err instanceof ApiError && err.status === 409 && err.code === 'DEVICE_LIMIT_REACHED') {
      const data = err.data as { currentDevice: DeviceLimitInfo | null } | undefined
      return { type: 'DEVICE_LIMIT_REACHED', currentDevice: data?.currentDevice ?? null }
    }
    return { type: 'ERROR' }
  }
}
