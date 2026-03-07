import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function generateSuggestions(base) {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 99) + 1
  return [
    `${base}${rand}`,
    `${base}_${year}`,
    `${base}.${Math.floor(Math.random() * 999) + 1}`,
  ]
}

export default function RegisterScreen({ onGoLogin }) {
  const { signUp } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuggestions([])

    const user = username.trim().toLowerCase()

    if (!user || !password || !confirmPassword) {
      setError('Preencha todos os campos.')
      return
    }

    if (user.length < 3) {
      setError('O usuário deve ter no mínimo 3 caracteres.')
      return
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(user)) {
      setError('Use apenas letras, números, ponto, traço ou underline.')
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
      await signUp(user, password)
    } catch (err) {
      if (err.message === 'USERNAME_TAKEN') {
        setError('Este usuário já está em uso. Escolha uma das sugestões abaixo ou tente outro.')
        setSuggestions(generateSuggestions(user))
      } else {
        setError('Erro ao cadastrar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const pickSuggestion = (s) => {
    setUsername(s)
    setSuggestions([])
    setError('')
  }

  const handleUsernameChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 30)
    setUsername(val)
    if (suggestions.length) {
      setSuggestions([])
      setError('')
    }
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

        {suggestions.length > 0 && (
          <div className="username-suggestions">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                className="suggestion-chip"
                onClick={() => pickSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="auth-field">
            <label>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="escolha.seu.usuario"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <span className="auth-field-hint">Letras, números, ponto, traço ou underline</span>
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
