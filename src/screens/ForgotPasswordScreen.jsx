import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ForgotPasswordScreen({ onGoLogin }) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Informe seu email.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(email.trim().toLowerCase())
      setSent(true)
    } catch (err) {
      setError('Erro ao enviar email. Verifique o endereço e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-logo">
            <div className="auth-verify-icon">📧</div>
          </div>
          <h2 className="auth-title">Email enviado</h2>
          <p className="auth-subtitle">
            Enviamos um link de recuperação para<br />
            <strong>{email}</strong>
          </p>
          <p className="auth-hint">
            Verifique sua caixa de entrada e a pasta de spam.
          </p>
          <button className="auth-btn-primary" onClick={onGoLogin}>
            Voltar ao login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#lg4)" />
            <path d="M14 32V18l6-4v18M20 24h8M28 32V14l6 4v14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="lg4" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#007AFF"/><stop offset="1" stopColor="#5856D6"/></linearGradient></defs>
          </svg>
        </div>

        <h2 className="auth-title">Recuperar senha</h2>
        <p className="auth-subtitle">
          Informe seu email para receber o link de recuperação.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              autoCapitalize="none"
            />
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        <button className="auth-back-link" onClick={onGoLogin}>
          ← Voltar ao login
        </button>
      </div>
    </div>
  )
}
