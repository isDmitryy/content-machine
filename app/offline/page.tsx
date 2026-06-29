'use client'

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#08080F',
        color: '#E8E8FF',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        padding: '24px',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(124,58,237,0.12)',
          border: '1px solid rgba(124,58,237,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}
      >
        ⚡
      </div>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 900,
          margin: 0,
          background: 'linear-gradient(135deg, #F0F0FF 0%, #C4B5FD 45%, #60A5FA 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Нет подключения
      </h1>
      <p style={{ color: '#3D4470', fontSize: 14, margin: 0, maxWidth: 320 }}>
        Content Machine требует интернет для генерации контента. Проверь соединение и попробуй снова.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        Попробовать снова
      </button>
    </main>
  )
}
