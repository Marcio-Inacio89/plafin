import React, { useState, useEffect } from 'react'

function getPlatform() {
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true
}

export default function LandingPage({ onContinue }) {
  const [platform] = useState(getPlatform)
  const [showInstructions, setShowInstructions] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        return
      }
    }
    setShowInstructions(true)
  }

  return (
    <div className="landing-page">
      <div className="landing-bg">
        <div className="landing-circle c1" />
        <div className="landing-circle c2" />
        <div className="landing-circle c3" />
      </div>

      <div className="landing-content">
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#lg)" />
              <path d="M14 32V18l6-4v18M20 24h8M28 32V14l6 4v14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="lg" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#007AFF"/><stop offset="1" stopColor="#5856D6"/></linearGradient></defs>
            </svg>
          </div>
          <h1 className="landing-title">Plafin</h1>
          <p className="landing-subtitle">Planejador Financeiro Preditivo</p>
        </div>

        <div className="landing-features">
          <div className="landing-feature">
            <span className="landing-feature-icon">📊</span>
            <div>
              <strong>Projeção Inteligente</strong>
              <p>Visualize seu saldo futuro mês a mês</p>
            </div>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon">📄</span>
            <div>
              <strong>Importação de PDF</strong>
              <p>Leia extratos e faturas automaticamente</p>
            </div>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon">🔒</span>
            <div>
              <strong>Seguro e Privado</strong>
              <p>Seus dados protegidos com criptografia</p>
            </div>
          </div>
        </div>

        <div className="landing-actions">
          <button className="landing-install-btn" onClick={handleInstall}>
            {platform === 'ios' && (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.5 10.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.6.9-.7 0-1.9-.8-3.1-.8C4.7 5.7 3 6.9 3 10.9c0 2.4.9 4.8 2.1 6.4.7 1 1.5 2.1 2.6 2.1 1-.1 1.4-.7 2.7-.7 1.3 0 1.6.7 2.7.6 1.1 0 1.8-1 2.5-2 .5-.7.9-1.4 1.1-1.8-2.4-1-2.2-3.5-2.2-3.7zM12.4 4.6C13 3.9 13.4 2.9 13.3 2 12.4 2 11.4 2.6 10.8 3.3c-.6.6-1.1 1.6-1 2.5 1 .1 2-.5 2.6-1.2z" fill="currentColor"/></svg>
                Instalar no iPhone
              </>
            )}
            {platform === 'android' && (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 7v6c0 .6.4 1 1 1h1v3c0 .6.4 1 1 1s1-.4 1-1v-3h6v3c0 .6.4 1 1 1s1-.4 1-1v-3h1c.6 0 1-.4 1-1V7H3zM14.5 6H5.5c-.1 0-.2 0-.3-.1l-2-3.4c-.3-.5-.1-1.1.4-1.4.5-.3 1.1-.1 1.4.4L6.4 4h7.2l1.4-2.4c.3-.5.9-.7 1.4-.4s.7.9.4 1.4l-2 3.4c-.1 0-.2.1-.3 0zM8 5.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zM12 5.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5z" fill="currentColor"/></svg>
                Instalar no Android
              </>
            )}
            {platform === 'desktop' && (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v12m0 0l-4-4m4 4l4-4M3 16h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Instalar Aplicativo
              </>
            )}
          </button>

          <button className="landing-web-btn" onClick={onContinue}>
            Continuar no navegador
          </button>
        </div>

        {showInstructions && (
          <div className="landing-instructions">
            {platform === 'ios' ? (
              <>
                <p className="instruction-title">Como instalar no iPhone:</p>
                <ol>
                  <li>Toque no ícone <strong>Compartilhar</strong> (⬆️) na barra inferior do Safari</li>
                  <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></li>
                  <li>Toque em <strong>"Adicionar"</strong></li>
                </ol>
              </>
            ) : platform === 'android' ? (
              <>
                <p className="instruction-title">Como instalar no Android:</p>
                <ol>
                  <li>Toque no menu <strong>⋮</strong> do Chrome (canto superior direito)</li>
                  <li>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></li>
                  <li>Confirme tocando em <strong>"Instalar"</strong></li>
                </ol>
              </>
            ) : (
              <>
                <p className="instruction-title">Para a melhor experiência:</p>
                <ol>
                  <li>Acesse este link pelo celular</li>
                  <li>No <strong>iPhone</strong>: Safari → Compartilhar → Adicionar à Tela de Início</li>
                  <li>No <strong>Android</strong>: Chrome → Menu → Instalar aplicativo</li>
                </ol>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
