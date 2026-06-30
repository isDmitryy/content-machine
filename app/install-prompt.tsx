'use client'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'cm:install-dismissed'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => setVisible(false)

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 290,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#0C0C18',
        border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: '14px',
        padding: '14px 16px',
        maxWidth: '320px',
        boxShadow: '0 0 30px rgba(124,58,237,0.15), 0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{ fontSize: '20px' }}>⚡</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#E0E0FF' }}>
          Установить Content Machine
        </div>
        <div style={{ fontSize: '11px', color: '#3D4470', marginTop: '2px' }}>
          Быстрый доступ с главного экрана
        </div>
      </div>
      <button
        onClick={install}
        style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 14px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Установить
      </button>
      <button
        onClick={dismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#3D4470',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '0 4px',
        }}
        aria-label="Закрыть"
      >
        ×
      </button>
    </div>
  )
}
