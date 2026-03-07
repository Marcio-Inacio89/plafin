import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen({ onGoRegister, onGoForgot }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Preencha todos os campos.')
      return
    }

    setLoading(true)
    try {
      await signIn(email.trim().toLowerCase(), password)
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login')) {
        setError('Email ou senha incorretos.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Email ainda não verificado. Verifique sua caixa de entrada.')
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#lg2)" />
            <path d="M14 32V18l6-4v18M20 24h8M28 32V14l6 4v14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="lg2" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#007AFF"/><stop offset="1" stopColor="#5856D6"/></linearGradient></defs>
          </svg>
          <h1 className="auth-app-name">Plafin</h1>
        </div>

        <h2 className="auth-title">Entrar</h2>

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

          <div className="auth-field">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="button"
            className="auth-forgot-link"
            onClick={onGoForgot}
          >
            Esqueceu a senha?
          </button>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <button
          className="auth-btn-secondary"
          onClick={onGoRegister}
        >
          Criar conta
        </button>
      </div>
    </div>
  )
}
