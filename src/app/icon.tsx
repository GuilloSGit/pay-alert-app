import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: '#059669',
          borderRadius: 115,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* viewBox recortado a los bounds reales de la campana (x:9-23, y:5-24) */}
        <svg width="390" height="390" viewBox="9 5 14 19" fill="none">
          <path
            d="M16 6a2 2 0 0 0-2 2v.87A6 6 0 0 0 10 15v4l-1.5 1.5V21h15v-.5L22 19v-4a6 6 0 0 0-4-5.87V8a2 2 0 0 0-2-2z"
            fill="white"
          />
          <path d="M13.5 21a2.5 2.5 0 0 0 5 0h-5z" fill="white" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
