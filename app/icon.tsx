import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '20%',
      }}
    >
      <span style={{ color: 'white', fontSize: 300, fontWeight: 900 }}>C</span>
    </div>,
    { width: 512, height: 512 }
  )
}
