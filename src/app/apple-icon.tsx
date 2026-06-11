import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#059669',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="110" height="110" viewBox="0 0 32 32" fill="none">
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
