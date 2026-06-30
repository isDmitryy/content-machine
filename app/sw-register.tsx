'use client'
import { useEffect, useState } from 'react'

export default function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let reloaded = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    })

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (registration.waiting && registration.active) {
          setWaitingWorker(registration.waiting)
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(installing)
            }
          })
        })
      })
      .catch(console.error)
  }, [])

  if (!waitingWorker) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#0C0C18',
        border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: '14px',
        padding: '12px 16px',
        boxShadow: '0 0 30px rgba(124,58,237,0.15), 0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{ fontSize: '13px', color: '#C8C8E8' }}>Доступно обновление</span>
      <button
        onClick={() => waitingWorker.postMessage('SKIP_WAITING')}
        style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Обновить
      </button>
    </div>
  )
}
