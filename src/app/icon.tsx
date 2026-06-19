import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#0E0E1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid #2A2A45',
        }}
      >
        <span
          style={{
            color: '#E8FF47',
            fontSize: 20,
            fontWeight: 900,
            fontFamily: 'Arial',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  )
}
