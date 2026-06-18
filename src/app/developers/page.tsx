import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Developers — Pay Alert',
  description: 'Documentación para integrar Pay Alert en tu sistema. Webhooks salientes, verificación de firmas HMAC y referencia de la API.',
}

function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#059669" />
      <path d="M16 6a2 2 0 0 0-2 2v.87A6 6 0 0 0 10 15v4l-1.5 1.5V21h15v-.5L22 19v-4a6 6 0 0 0-4-5.87V8a2 2 0 0 0-2-2z" fill="white" />
      <path d="M13.5 21a2.5 2.5 0 0 0 5 0h-5z" fill="white" />
    </svg>
  )
}

function Code({ children, className = '' }: { children: string; className?: string }) {
  return (
    <pre className={`overflow-x-auto rounded-xl bg-[#0d1117] p-5 text-sm leading-relaxed text-[#e6edf3] ${className}`}>
      <code>{children}</code>
    </pre>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">{children}</p>
  )
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-md bg-primary-light px-2 py-0.5 font-mono text-xs font-semibold text-primary">
      {children}
    </span>
  )
}

function Method({ method }: { method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-50 text-blue-700',
    POST: 'bg-emerald-50 text-emerald-700',
    PUT: 'bg-amber-50 text-amber-700',
    DELETE: 'bg-red-50 text-red-700',
    PATCH: 'bg-purple-50 text-purple-700',
  }
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${colors[method]}`}>
      {method}
    </span>
  )
}

const NODE_VERIFY = `const crypto = require('crypto')

function verifySignature(secret, body, signature) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

// Express / Fastify — leer el body como string crudo
app.post('/webhook/pay-alert', (req, res) => {
  const sig = req.headers['x-pay-alert-signature']
  const rawBody = req.rawBody // bodyParser con { verify } o similar

  if (!verifySignature(process.env.WEBHOOK_SECRET, rawBody, sig)) {
    return res.status(401).send('Firma inválida')
  }

  const event = JSON.parse(rawBody)
  console.log('Evento recibido:', event.event, event.data)

  res.sendStatus(200)
})`

const PYTHON_VERIFY = `import hmac
import hashlib

def verify_signature(secret: str, body: bytes, signature: str) -> bool:
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

# Flask
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhook/pay-alert', methods=['POST'])
def webhook():
    sig = request.headers.get('X-Pay-Alert-Signature', '')
    raw_body = request.get_data()

    if not verify_signature(os.environ['WEBHOOK_SECRET'], raw_body, sig):
        return 'Firma inválida', 401

    event = request.get_json()
    print('Evento:', event['event'], event['data'])

    return '', 200`

const PHP_VERIFY = `<?php
function verifySignature(string $secret, string $body, string $signature): bool {
    $expected = 'sha256=' . hash_hmac('sha256', $body, $secret);
    return hash_equals($expected, $signature);
}

$secret = getenv('WEBHOOK_SECRET');
$rawBody = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_PAY_ALERT_SIGNATURE'] ?? '';

if (!verifySignature($secret, $rawBody, $signature)) {
    http_response_code(401);
    exit('Firma inválida');
}

$event = json_decode($rawBody, true);
error_log('Evento: ' . $event['event']);

http_response_code(200);`

const PAYLOAD_EXAMPLE = `{
  "event": "payment.approved",
  "businessId": "cmpa61k6h0002y5sf33s3ixaj",
  "timestamp": "2026-06-18T14:32:00.000Z",
  "data": {
    "id": "cmpx9k2ab0001y5wnabc12345",
    "mpPaymentId": "123456789",
    "amount": "15000.00",
    "currency": "ARS",
    "status": "APPROVED",
    "description": "Producto XYZ",
    "payerName": "Juan García",
    "payerEmail": null,
    "paymentMethod": "account_money",
    "paidAt": "2026-06-18T14:31:58.000Z",
    "receivedAt": "2026-06-18T14:32:00.000Z"
  }
}`

const CURL_CREATE = `curl -X POST https://pay-alert-api.onrender.com/api/v1/businesses/{businessId}/webhooks \\
  -H "Authorization: Bearer <tu-access-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://tu-servidor.com/webhook/pay-alert",
    "events": ["payment.approved", "payment.refunded"],
    "isActive": true
  }'`

const CURL_LIST = `curl https://pay-alert-api.onrender.com/api/v1/businesses/{businessId}/webhooks \\
  -H "Authorization: Bearer <tu-access-token>"`

const CURL_TEST = `curl -X POST https://pay-alert-api.onrender.com/api/v1/businesses/{businessId}/webhooks/{webhookId}/test \\
  -H "Authorization: Bearer <tu-access-token>" \\
  -H "Content-Type: application/json" \\
  -d '{}'`

const CURL_REGEN = `curl -X PUT https://pay-alert-api.onrender.com/api/v1/businesses/{businessId}/webhooks/{webhookId} \\
  -H "Authorization: Bearer <tu-access-token>" \\
  -H "Content-Type: application/json" \\
  -d '{ "regenerateSecret": true }'`

export default function DevelopersPage() {
  return (
    <div className="flex min-h-screen flex-col">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoIcon size={24} />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">Pay Alert</span>
            <span className="ml-1 rounded-md bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">Developers</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="#webhooks" className="hidden text-sm text-muted transition-colors hover:text-foreground sm:block">Webhooks</a>
            <a href="#payload" className="hidden text-sm text-muted transition-colors hover:text-foreground sm:block">Payload</a>
            <a href="#api" className="hidden text-sm text-muted transition-colors hover:text-foreground sm:block">API</a>
            <Link href="/login" className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="bg-[#040c07] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Enterprise · Plan requerido
            </div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Pay Alert para Desarrolladores
            </h1>
            <p className="max-w-2xl text-base text-white/60">
              Recibí notificaciones de pago en tiempo real en tu propio sistema.
              Pay Alert envía un <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-emerald-300">POST</code> firmado
              a tu servidor cada vez que ocurre un evento en tu comercio.
            </p>
          </div>
        </section>

        {/* Índice rápido */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
              {[
                ['#webhooks', 'Verificación de firma'],
                ['#payload', 'Referencia del payload'],
                ['#events', 'Eventos disponibles'],
                ['#api', 'Gestionar webhooks via API'],
              ].map(([href, label]) => (
                <a key={href} href={href} className="transition-colors hover:text-foreground">{label}</a>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-16 space-y-20">

          {/* Cómo funciona */}
          <section>
            <SectionLabel>Cómo funciona</SectionLabel>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Flujo de un webhook</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { n: '01', title: 'Registrás tu endpoint', body: 'Creás un webhook en Pay Alert con la URL de tu servidor y los eventos que querés recibir.' },
                { n: '02', title: 'Ocurre un pago', body: 'Cuando un cliente paga, Pay Alert procesa el evento y envía un POST firmado a tu URL en segundos.' },
                { n: '03', title: 'Verificás y procesás', body: 'Tu servidor verifica la firma HMAC-SHA256, parsea el JSON y ejecuta tu lógica de negocio.' },
              ].map(({ n, title, body }) => (
                <div key={n} className="rounded-xl border border-border bg-background p-5">
                  <p className="mb-2 font-mono text-2xl font-bold text-primary/30">{n}</p>
                  <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Verificación */}
          <section id="webhooks">
            <SectionLabel>Seguridad</SectionLabel>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Verificación de firma</h2>
            <p className="mb-6 text-base text-muted">
              Cada request incluye el header <Tag>X-Pay-Alert-Signature</Tag> con un HMAC-SHA256
              del body firmado con tu secret. Siempre verificar antes de procesar.
            </p>

            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Importante:</strong> leer el body como string crudo antes de parsearlo como JSON.
              Modificar el body antes de verificar la firma causará fallos de validación.
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <span className="h-px flex-1 bg-border" /> Node.js <span className="h-px flex-1 bg-border" />
                </p>
                <Code>{NODE_VERIFY}</Code>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <span className="h-px flex-1 bg-border" /> Python <span className="h-px flex-1 bg-border" />
                </p>
                <Code>{PYTHON_VERIFY}</Code>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <span className="h-px flex-1 bg-border" /> PHP <span className="h-px flex-1 bg-border" />
                </p>
                <Code>{PHP_VERIFY}</Code>
              </div>
            </div>
          </section>

          {/* Payload */}
          <section id="payload">
            <SectionLabel>Referencia</SectionLabel>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Estructura del payload</h2>
            <p className="mb-6 text-base text-muted">
              Pay Alert envía un JSON con esta estructura en todos los eventos.
            </p>

            <div className="grid gap-8 lg:grid-cols-2">
              <Code>{PAYLOAD_EXAMPLE}</Code>

              <div className="space-y-3">
                {[
                  { field: 'event', type: 'string', desc: 'Tipo de evento. Ver tabla de eventos.' },
                  { field: 'businessId', type: 'string', desc: 'ID del comercio en Pay Alert.' },
                  { field: 'timestamp', type: 'string (ISO 8601)', desc: 'Fecha y hora del envío en UTC.' },
                  { field: 'data.id', type: 'string', desc: 'ID interno del pago en Pay Alert.' },
                  { field: 'data.mpPaymentId', type: 'string', desc: 'ID del pago en Mercado Pago.' },
                  { field: 'data.amount', type: 'string (decimal)', desc: 'Monto del pago.' },
                  { field: 'data.currency', type: 'string', desc: 'Código ISO 4217. Ej: "ARS".' },
                  { field: 'data.status', type: 'string', desc: 'Estado: APPROVED | REJECTED | REFUNDED | CANCELLED.' },
                  { field: 'data.payerName', type: 'string | null', desc: 'Nombre del pagador (si está disponible).' },
                  { field: 'data.payerEmail', type: 'string | null', desc: 'Email del pagador (si está disponible).' },
                  { field: 'data.paymentMethod', type: 'string | null', desc: 'Método: account_money, bank_transfer, credit_card, etc.' },
                  { field: 'data.paidAt', type: 'string | null', desc: 'Fecha de aprobación del pago.' },
                  { field: 'data.receivedAt', type: 'string', desc: 'Fecha en que Pay Alert recibió el evento de MP.' },
                ].map(({ field, type, desc }) => (
                  <div key={field} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs font-semibold text-foreground">{field}</code>
                      <span className="text-[11px] text-muted">{type}</span>
                    </div>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Eventos */}
          <section id="events">
            <SectionLabel>Eventos</SectionLabel>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Eventos disponibles</h2>
            <p className="mb-6 text-base text-muted">
              Suscribite solo a los eventos que tu sistema necesita. Un array vacío recibe todos.
            </p>

            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Evento</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Cuándo se dispara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {[
                    { event: 'payment.approved', when: 'Un pago es aprobado por Mercado Pago. Incluye pagos nuevos y actualizaciones de estado.' },
                    { event: 'payment.received', when: 'Pay Alert recibe un pago aprobado por primera vez (sin procesar antes).' },
                    { event: 'payment.refunded', when: 'Un pago es reembolsado total o parcialmente.' },
                    { event: 'payment.cancelled', when: 'Un pago pendiente es cancelado.' },
                  ].map(({ event, when }) => (
                    <tr key={event}>
                      <td className="px-5 py-3.5">
                        <code className="font-mono text-xs font-semibold text-primary">{event}</code>
                      </td>
                      <td className="px-5 py-3.5 text-muted">{when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* API */}
          <section id="api">
            <SectionLabel>API REST</SectionLabel>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Gestionar webhooks</h2>
            <p className="mb-8 text-base text-muted">
              Los webhooks se administran vía API con tu access token JWT. Rol mínimo requerido: <Tag>ADMIN</Tag>.
              El plan Enterprise es necesario para crear webhooks.
            </p>

            <div className="space-y-10">

              {/* Crear */}
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <Method method="POST" />
                  <code className="font-mono text-sm text-foreground">/api/v1/businesses/{'{businessId}'}/webhooks</code>
                </div>
                <p className="mb-3 text-sm text-muted">Crea un webhook. Devuelve el <strong>secret</strong> solo en la creación — guardalo de forma segura.</p>
                <Code>{CURL_CREATE}</Code>
              </div>

              {/* Listar */}
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <Method method="GET" />
                  <code className="font-mono text-sm text-foreground">/api/v1/businesses/{'{businessId}'}/webhooks</code>
                </div>
                <p className="mb-3 text-sm text-muted">Lista todos los webhooks del comercio (sin el secret).</p>
                <Code>{CURL_LIST}</Code>
              </div>

              {/* Test */}
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <Method method="POST" />
                  <code className="font-mono text-sm text-foreground">/api/v1/businesses/{'{businessId}'}/webhooks/{'{webhookId}'}/test</code>
                </div>
                <p className="mb-3 text-sm text-muted">Envía un evento de prueba <Tag>payment.approved</Tag> a la URL configurada. Útil para verificar que tu endpoint responde correctamente.</p>
                <Code>{CURL_TEST}</Code>
              </div>

              {/* Regenerar secret */}
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <Method method="PUT" />
                  <code className="font-mono text-sm text-foreground">/api/v1/businesses/{'{businessId}'}/webhooks/{'{webhookId}'}</code>
                </div>
                <p className="mb-3 text-sm text-muted">
                  Actualiza <code className="font-mono text-xs">url</code>, <code className="font-mono text-xs">events</code>, <code className="font-mono text-xs">isActive</code>.
                  Con <code className="font-mono text-xs">regenerateSecret: true</code> rota el secret y devuelve el nuevo valor.
                </p>
                <Code>{CURL_REGEN}</Code>
              </div>

            </div>
          </section>

          {/* Buenas prácticas */}
          <section>
            <SectionLabel>Buenas prácticas</SectionLabel>
            <h2 className="mb-6 text-2xl font-bold text-foreground">Implementación recomendada</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: 'Responder 200 rápido',
                  body: 'Devolvé 200 antes de procesar la lógica pesada. Si tardás más de 10 segundos, Pay Alert considera que falló la entrega.',
                },
                {
                  title: 'Idempotencia',
                  body: 'El mismo evento puede llegar más de una vez. Usá data.id o data.mpPaymentId como clave de idempotencia en tu base de datos.',
                },
                {
                  title: 'Siempre verificar firma',
                  body: 'Nunca procesar un webhook sin verificar X-Pay-Alert-Signature. Cualquiera puede hacer un POST a tu URL.',
                },
                {
                  title: 'Rotación de secret',
                  body: 'Si sospechás que tu secret fue comprometido, regeneralo desde la API con regenerateSecret: true. Actualizá tu variable de entorno de inmediato.',
                },
              ].map(({ title, body }) => (
                <div key={title} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-1.5 font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl bg-[#040c07] p-10 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white">¿Necesitás ayuda con la integración?</h2>
            <p className="mb-6 text-base text-white/60">
              Para clientes Enterprise, el soporte técnico está incluido.
              También podemos desarrollar la integración a medida para tu sistema.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="https://wa.me/543876295801"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Contactar por WhatsApp
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={20} />
            <span className="text-sm font-semibold text-foreground">Pay Alert</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <Link href="/" className="transition-colors hover:text-foreground">Inicio</Link>
            <Link href="/#pricing" className="transition-colors hover:text-foreground">Planes</Link>
            <Link href="/login" className="transition-colors hover:text-foreground">Iniciar sesión</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
