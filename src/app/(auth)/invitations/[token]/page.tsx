'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { api, ApiError } from '@/lib/api'
import { saveSession } from '@/lib/auth'
import type { ApiResponse, User } from '@/types'

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Dueño',
  ADMIN: 'Administrador',
  MEMBER: 'Empleado',
  OBSERVER: 'Observador',
}

interface InvitationInfo {
  businessName: string
  inviterName: string
  role: string
  email: string
  expiresAt: string
}

type Step = 'loading' | 'error' | 'otp' | 'register'

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [step, setStep] = useState<Step>('loading')
  const [info, setInfo] = useState<InvitationInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registerLoading, setRegisterLoading] = useState(false)

  useEffect(() => {
    api
      .get<ApiResponse<InvitationInfo>>(`/api/v1/invitations/${token}`, { skipAuth: true })
      .then((res) => {
        setInfo(res.data)
        setStep('otp')
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 410) {
          setLoadError('La invitación no existe, ya fue usada o expiró.')
        } else {
          setLoadError('No se pudo cargar la invitación. Intentá de nuevo.')
        }
        setStep('error')
      })
  }, [token])

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setOtpError(null)
    setOtpLoading(true)
    try {
      const res = await api.post<ApiResponse<{ accessToken: string; user: User }>>(
        `/api/v1/invitations/${token}/accept`,
        { otp },
        { skipAuth: true },
      )
      saveSession(res.data.accessToken, res.data.user)
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'MISSING_CREDENTIALS') {
          setStep('register')
        } else {
          setOtpError(err.message)
        }
      } else {
        setOtpError('Error de conexión. Intentá de nuevo.')
      }
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setRegisterError(null)
    setRegisterLoading(true)
    try {
      const res = await api.post<ApiResponse<{ accessToken: string; user: User }>>(
        `/api/v1/invitations/${token}/accept`,
        { otp, name, password },
        { skipAuth: true },
      )
      saveSession(res.data.accessToken, res.data.user)
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        setRegisterError(err.message)
      } else {
        setRegisterError('Error de conexión. Intentá de nuevo.')
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  if (step === 'loading') {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner />
          <p className="text-sm text-muted">Cargando invitación...</p>
        </div>
      </Card>
    )
  }

  if (step === 'error') {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Invitación inválida</h2>
          <p className="text-sm text-muted">{loadError}</p>
        </div>
      </Card>
    )
  }

  const invitationBanner = info && (
    <div className="mb-6 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-muted">
        <span className="font-medium text-foreground">{info.inviterName}</span>
        {' '}te invita a unirte a{' '}
        <span className="font-medium text-foreground">{info.businessName}</span>
        {' '}como{' '}
        <span className="font-medium text-primary">{ROLE_LABELS[info.role] ?? info.role}</span>.
      </p>
    </div>
  )

  if (step === 'otp') {
    return (
      <Card>
        <h2 className="text-xl font-semibold text-foreground mb-1">Verificá tu identidad</h2>
        <p className="text-sm text-muted mb-6">Revisá tu casilla de correo</p>

        {invitationBanner}

        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Te enviamos un código de 6 dígitos a{' '}
            <span className="font-medium text-foreground">{info?.email}</span>.
            Ingresalo para confirmar que sos vos.
          </p>

          <Input
            id="otp"
            name="otp"
            type="text"
            label="Código de verificación"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            required
          />

          {otpError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{otpError}</p>
          )}

          <Button
            type="submit"
            loading={otpLoading}
            disabled={otp.length !== 6 || otpLoading}
            size="lg"
            className="mt-2 w-full"
          >
            Verificar
          </Button>
        </form>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold text-foreground mb-1">Creá tu cuenta</h2>
      <p className="text-sm text-muted mb-6">Completá tus datos para unirte al equipo</p>

      {invitationBanner}

      <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          name="name"
          type="text"
          label="Tu nombre"
          placeholder="Tu nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          placeholder="Mínimo 8 caracteres, una mayúscula y un número"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        {registerError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{registerError}</p>
        )}

        <Button
          type="submit"
          loading={registerLoading}
          disabled={registerLoading}
          size="lg"
          className="mt-2 w-full"
        >
          Unirme al equipo
        </Button>
      </form>
    </Card>
  )
}
