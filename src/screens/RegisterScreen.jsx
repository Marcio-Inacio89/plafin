import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function RegisterScreen({ onGoLogin }) {
  const { signUp, verifyOtp } = useAuth()
  const [step, setStep] = useState('form') // 'form' | 'verify'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password || !confirmPassword) {
      setError('Preencha todos os campos.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const data = await signUp(email.trim().toLowerCase(), password)
      if (data.user && !data.user.email_confirmed_at) {
        setStep('verify')
      }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('already registered')) {
        setError('Este email já está cadastrado.')
      } else if (msg.includes('valid email')) {
        setError('Informe um email válido.')
      } else {
        setError('Erro ao cadastrar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')

    if (!code.trim() || code.trim().length < 6) {
      setError('Informe o código de 6 dígitos enviado por email.')
      return
    }

    setLoading(true)
    try {
      await verifyOtp(email.trim().toLowerCase(), code.trim())
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('expired') || msg.includes('invalid')) {
        setError('Código inválido ou expirado. Verifique e tente novamente.')
      } else {
        setError('Erro na verificação. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-logo">
            <div className="auth-verify-icon">✉️</div>
          </div>

          <h2 className="auth-title">Verificar email</h2>
          <p className="auth-subtitle">
            Enviamos um código de 6 dígitos para<br />
            <strong>{email}</strong>
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleVerify}>
            <div className="auth-field">
              <label>Código de verificação</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="auth-code-input"
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Confirmar'}
            </button>
          </form>

          <p className="auth-hint">
            Não recebeu? Verifique a pasta de spam.
          </p>

          <button
            className="auth-back-link"
            onClick={() => { setStep('form'); setError('') }}
          >
            ← Voltar
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
            <rect width="48" height="48" rx="12" fill="url(#lg3)" />
            <path d="M14 32V18l6-4v18M20 24h8M28 32V14l6 4v14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="lg3" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#007AFF"/><stop offset="1" stopColor="#5856D6"/></linearGradient></defs>
          </svg>
          <h1 className="auth-app-name">Plafin</h1>
        </div>

        <h2 className="auth-title">Criar conta</h2>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleRegister}>
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
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label>Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <button
          className="auth-btn-secondary"
          onClick={onGoLogin}
        >
          Já tenho conta
        </button>
      </div>
    </div>
  )
}
