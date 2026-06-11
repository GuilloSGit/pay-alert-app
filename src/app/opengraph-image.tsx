import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Pay Alert — Confirmación de Pago Instantánea'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          background: '#edf4ef',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Card */}
        <div
          style={{
            width: 1110,
            height: 556,
            background: 'white',
            borderRadius: 28,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 72px rgba(0,0,0,0.10)',
          }}
        >
          {/* Content area */}
          <div style={{ flex: 1, display: 'flex' }}>

            {/* Left — brand */}
            <div
              style={{
                flex: 1,
                padding: '56px 64px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 20,
              }}
            >
              {/* Logo + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    background: '#059669',
                    borderRadius: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M16 6a2 2 0 0 0-2 2v.87A6 6 0 0 0 10 15v4l-1.5 1.5V21h15v-.5L22 19v-4a6 6 0 0 0-4-5.87V8a2 2 0 0 0-2-2z"
                      fill="white"
                    />
                    <path d="M13.5 21a2.5 2.5 0 0 0 5 0h-5z" fill="white" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: 52,
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-1.5px',
                  }}
                >
                  Pay Alert
                </span>
              </div>

              {/* Tagline */}
              <p style={{ fontSize: 24, color: '#64748b', margin: 0, fontWeight: 400 }}>
                Confirmación de Pago Instantánea
              </p>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 10 }}>
                {['&lt; 15 seg', '99.9% uptime', 'Verificado por MP'].map((b) => (
                  <div
                    key={b}
                    style={{
                      background: '#ecfdf5',
                      color: '#059669',
                      fontSize: 15,
                      fontWeight: 700,
                      padding: '7px 16px',
                      borderRadius: 100,
                    }}
                  >
                    {b === '&lt; 15 seg' ? '< 15 seg' : b}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — phone mockup */}
            <div
              style={{
                width: 420,
                background: '#f1f6f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Phone frame */}
              <div
                style={{
                  width: 210,
                  height: 380,
                  background: '#0d1f14',
                  borderRadius: 36,
                  padding: '18px 13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                  border: '2px solid #1a3a22',
                  boxShadow: '0 32px 64px rgba(0,0,0,0.35)',
                }}
              >
                {/* Notch */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <div
                    style={{ width: 64, height: 5, background: '#1a3a22', borderRadius: 3 }}
                  />
                </div>

                {/* App bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    paddingBottom: 9,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      background: '#059669',
                      borderRadius: 5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 32 32" fill="none">
                      <path
                        d="M16 6a2 2 0 0 0-2 2v.87A6 6 0 0 0 10 15v4l-1.5 1.5V21h15v-.5L22 19v-4a6 6 0 0 0-4-5.87V8a2 2 0 0 0-2-2z"
                        fill="white"
                      />
                      <path d="M13.5 21a2.5 2.5 0 0 0 5 0h-5z" fill="white" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>
                    Pay Alert
                  </span>
                  <div style={{ flex: 1 }} />
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: '#059669',
                    }}
                  />
                </div>

                {/* Main notification */}
                <div
                  style={{
                    background: '#0a1510',
                    border: '1px solid #1e4a2a',
                    borderRadius: 14,
                    padding: 13,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        background: '#059669',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 8,
                        color: 'rgba(255,255,255,0.35)',
                        letterSpacing: '0.1em',
                      }}
                    >
                      PAGO VERIFICADO
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 30,
                      fontWeight: 800,
                      color: 'white',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    $15.000
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        background: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ color: 'white', fontSize: 9, fontWeight: 800 }}>
                        ✓
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>
                      Confirmado por MP
                    </span>
                  </div>
                </div>

                {/* Smaller previous notification */}
                <div
                  style={{
                    background: '#0a1510',
                    borderRadius: 11,
                    padding: '9px 11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)' }}>
                      hace 4 min
                    </span>
                    <span
                      style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}
                    >
                      $8.500
                    </span>
                  </div>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      background: 'rgba(5,150,105,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ color: '#059669', fontSize: 9 }}>✓</span>
                  </div>
                </div>

                {/* Bottom home indicator */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
                  <div
                    style={{
                      width: 48,
                      height: 4,
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom banner */}
          <div
            style={{
              height: 70,
              background: '#064e3b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}>
              Visita
            </span>
            <span
              style={{ fontSize: 28, color: 'white', fontWeight: 800, letterSpacing: '-0.5px' }}
            >
              pay-alert.com.ar
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
