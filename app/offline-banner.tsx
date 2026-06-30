'use client'
import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with navigator.onLine post-mount, avoids SSR hydration mismatch
    setIsOffline(!navigator.onLine)
    const goOnline = () => setIsOffline(false)
    const goOffline = () => setIsOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 250,
        textAlign: 'center',
        padding: '8px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#FCA5A5',
        background: 'rgba(248,113,113,0.12)',
        borderBottom: '1px solid rgba(248,113,113,0.25)',
      }}
    >
      Нет подключения к интернету — часть функций недоступна
    </div>
  )
}
