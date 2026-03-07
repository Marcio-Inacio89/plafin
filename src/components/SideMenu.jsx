import React, { useState, useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'

const CORES = ['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#AF52DE', '#5856D6', '#FF2D55', '#00C7BE']
const ICONES = ['👛', '🏦', '💳', '🏠', '💰', '📱', '🎯', '🐷']

const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function SideMenu({ onClose }) {
  const { state, dispatch } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(CORES[0])
  const [icone, setIcone] = useState(ICONES[0])

  const contaTotais = useMemo(() => {
    const totais = {}
    state.contas.forEach(c => { totais[c.id] = 0 })

    state.transacoes.forEach(t => {
      if (t.tipo === 'transferencia') {
        if (totais[t.contaId] !== undefined) totais[t.contaId] -= t.valor
        if (totais[t.contaDestinoId] !== undefined) totais[t.contaDestinoId] += t.valor
      } else if (t.tipo.startsWith('receita')) {
        if (totais[t.contaId] !== undefined) totais[t.contaId] += t.valor
      } else if (t.tipo.startsWith('despesa')) {
        if (totais[t.contaId] !== undefined) totais[t.contaId] -= t.valor
      }
    })

    return totais
  }, [state])

  const totalGeral = useMemo(() => {
    return Object.values(contaTotais).reduce((s, v) => s + v, 0)
  }, [contaTotais])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!nome.trim()) return
    dispatch({
      type: 'ADD_CONTA',
      payload: { id: Date.now().toString(), nome: nome.trim(), cor, icone }
    })
    setNome('')
    setShowForm(false)
  }

  const handleRemove = (id) => {
    if (state.contas.length <= 1) return
    dispatch({ type: 'REMOVE_CONTA', payload: id })
  }

  return (
    <div className="side-menu-overlay" onClick={onClose}>
      <div className="side-menu" onClick={e => e.stopPropagation()}>
        <div className="side-menu-header">
          <h2>Contas</h2>
          <button className="side-menu-close" onClick={onClose}>✕</button>
        </div>

        <div className="side-menu-content">
          <div className="contas-list">
            {state.contas.map(conta => (
              <div key={conta.id} className="conta-item">
                <div className="conta-icon-badge" style={{ background: conta.cor }}>
                  {conta.icone}
                </div>
                <div className="conta-info">
                  <span className="conta-nome">{conta.nome}</span>
                  <span
                    className="conta-saldo"
                    style={{ color: contaTotais[conta.id] >= 0 ? 'var(--ios-green)' : 'var(--ios-red)' }}
                  >
                    {fmt(contaTotais[conta.id] || 0)}
                  </span>
                </div>
                {state.contas.length > 1 && (
                  <button className="conta-remove" onClick={() => handleRemove(conta.id)}>✕</button>
                )}
              </div>
            ))}

            <div className="contas-total">
              <span className="contas-total-label">Total</span>
              <span
                className="contas-total-value"
                style={{ color: totalGeral >= 0 ? 'var(--ios-green)' : 'var(--ios-red)' }}
              >
                {fmt(totalGeral)}
              </span>
            </div>
          </div>

          {showForm ? (
            <form className="conta-form" onSubmit={handleAdd}>
              <input
                type="text"
                placeholder="Nome da conta"
                value={nome}
                onChange={e => setNome(e.target.value)}
                autoFocus
              />

              <div className="picker-section">
                <label>Cor</label>
                <div className="color-options">
                  {CORES.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`color-dot ${cor === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setCor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="picker-section">
                <label>Icone</label>
                <div className="icon-options">
                  {ICONES.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      className={`icon-option ${icone === ic ? 'selected' : ''}`}
                      onClick={() => setIcone(ic)}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="conta-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">Salvar</button>
              </div>
            </form>
          ) : (
            <button className="btn-add-conta" onClick={() => setShowForm(true)}>
              + Adicionar Conta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
