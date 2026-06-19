import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: '#0E0E1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: '#E8FF47',
            fontSize: 110,
            fontWeight: 900,
            fontFamily: 'Arial',
            letterSpacing: '-4px',
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
