import React, { useState, useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { adjustDate, formatDateShort } from '../utils/businessDays'
import SwipeableRow from '../components/SwipeableRow'

const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const TIPO_CFG = {
  receita_fixa:     { icon: '↓', isReceita: true,  bg: 'rgba(16, 185, 129, 0.10)', color: '#10B981' },
  receita_variavel: { icon: '↓', isReceita: true,  bg: 'rgba(16, 185, 129, 0.10)', color: '#10B981' },
  despesa_fixa:     { icon: '↑', isReceita: false, bg: 'rgba(244, 63, 94, 0.08)',  color: '#F43F5E' },
  despesa_variavel: { icon: '↑', isReceita: false, bg: 'rgba(244, 63, 94, 0.08)',  color: '#F43F5E' },
  transferencia:    { icon: '⇄', isReceita: null,  bg: 'rgba(99, 102, 241, 0.08)', color: '#6366F1' },
}

export default function HomeScreen({ mesSel, setMesSel, anoSel, setAnoSel, onEditTransaction }) {
  const { getTransacoesMes, getTotaisMes, getConta, state, dispatch } = useFinance()
  const [contaFiltro, setContaFiltro] = useState(null)
  const [swipedId, setSwipedId] = useState(null)

  const prevMes = () => {
    if (mesSel === 0) { setMesSel(11); setAnoSel(a => a - 1) }
    else setMesSel(m => m - 1)
  }
  const nextMes = () => {
    if (mesSel === 11) { setMesSel(0); setAnoSel(a => a + 1) }
    else setMesSel(m => m + 1)
  }

  const transacoes = getTransacoesMes(mesSel, anoSel, contaFiltro)
  const totais = getTotaisMes(mesSel, anoSel, contaFiltro)

  const items = useMemo(() => {
    return transacoes.map(t => {
      const isFixed = t.tipo === 'receita_fixa' || t.tipo === 'despesa_fixa'
      if (isFixed) {
        const r = adjustDate(t.diaVencimento || 1, mesSel, anoSel, t.tipo)
        return { ...t, _date: r.date, _adjusted: r.adjusted, _direction: r.direction }
      }
      return { ...t, _date: new Date(t.ano, t.mes, t.dia || 1), _adjusted: false, _direction: null }
    }).sort((a, b) => a._date - b._date)
  }, [transacoes, mesSel, anoSel])

  const dayGroups = useMemo(() => {
    const groups = []
    let runningBalance = 0
    let currentDay = null

    items.forEach(t => {
      if (t.tipo === 'transferencia') {
        if (contaFiltro) {
          if (t.contaId === contaFiltro) runningBalance -= t.valor
          if (t.contaDestinoId === contaFiltro) runningBalance += t.valor
        }
      } else if (TIPO_CFG[t.tipo].isReceita) {
        runningBalance += t.valor
      } else {
        runningBalance -= t.valor
      }

      const dayKey = t._date.getDate()
      if (dayKey !== currentDay) {
        currentDay = dayKey
        groups.push({ dayKey, date: t._date, transactions: [t], balance: runningBalance })
      } else {
        groups[groups.length - 1].transactions.push(t)
        groups[groups.length - 1].balance = runningBalance
      }
    })

    return groups
  }, [items, contaFiltro])

  const handleDelete = (id) => {
    dispatch({ type: 'REMOVE_TRANSACAO', payload: id })
    setSwipedId(null)
  }

  const handleRowClick = (t) => {
    if (swipedId) {
      setSwipedId(null)
      return
    }
    onEditTransaction(t)
  }

  const formatDayLabel = (date) => {
    const d = date.getDate()
    const m = MESES_CURTOS[date.getMonth()]
    return `${d} ${m}`
  }

  const isConsolidada = (t) => {
    const key = `${mesSel}-${anoSel}`
    if (t.consolidadas?.[key]) return true
    if (t.consolidada && !(t.tipo === 'receita_fixa' || t.tipo === 'despesa_fixa')) return true
    return false
  }

  const renderTransaction = (t) => {
    const cfg = TIPO_CFG[t.tipo]
    const conta = getConta(t.contaId)
    const contaDest = t.contaDestinoId ? getConta(t.contaDestinoId) : null

    const isFixed = t.tipo === 'receita_fixa' || t.tipo === 'despesa_fixa'
    const consolidated = isConsolidada(t)

    const parts = []
    if (contaDest) parts.push(`${conta?.nome} → ${contaDest?.nome}`)
    else parts.push(conta?.nome || '')
    parts.push(formatDateShort(t._date))

    const prefix = cfg.isReceita === false ? '−' : ''

    return (
      <SwipeableRow
        key={t.id}
        isOpen={swipedId === t.id}
        onOpenChange={(open) => setSwipedId(open ? t.id : null)}
        onDelete={() => handleDelete(t.id)}
      >
        <div
          className={`transaction-row ${consolidated ? 'consolidated' : ''}`}
          style={{ '--row-accent': cfg.accent }}
          onClick={() => handleRowClick(t)}
        >
          <button
            className={`consolidation-toggle ${consolidated ? 'done' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              dispatch({ type: 'TOGGLE_CONSOLIDADA', payload: { id: t.id, mes: mesSel, ano: anoSel } })
            }}
          >
            {consolidated && '✓'}
          </button>

          <div className="transaction-icon" style={{ background: cfg.bg, color: cfg.color, fontWeight: 700 }}>
            {cfg.icon}
            {isFixed && <span className="recurrence-badge">↻</span>}
          </div>

          <div className="transaction-info">
            <div className="transaction-desc">{t.descricao}</div>
            <div className="transaction-meta">
              {parts.join(' · ')}
              {t._adjusted && (
                <span className={`date-badge ${t._direction}`}>
                  {t._direction === 'antecipado' ? ' ↩ antecipado' : ' ↪ adiado'}
                </span>
              )}
            </div>
          </div>

          <div className="transaction-amount-col">
            <span className="transaction-amount">
              {prefix}{fmt(t.valor)}
            </span>
          </div>

          <span className="row-chevron">›</span>
        </div>
      </SwipeableRow>
    )
  }

  return (
    <div>
      <div className="month-selector">
        <button className="month-arrow" onClick={prevMes}>‹</button>
        <span className="month-label">{NOMES_MESES[mesSel]} {anoSel}</span>
        <button className="month-arrow" onClick={nextMes}>›</button>
      </div>

      <div className="account-filter">
        <button
          className={`filter-chip ${contaFiltro === null ? 'active' : ''}`}
          onClick={() => setContaFiltro(null)}
        >Todas</button>
        {state.contas.map(c => (
          <button
            key={c.id}
            className={`filter-chip ${contaFiltro === c.id ? 'active' : ''}`}
            onClick={() => setContaFiltro(contaFiltro === c.id ? null : c.id)}
            style={contaFiltro === c.id ? { background: c.cor, borderColor: c.cor } : {}}
          >{c.icone} {c.nome}</button>
        ))}
      </div>

      <div className="summary-compact">
        <div className="summary-compact-item">
          <div className="summary-compact-label">Receitas</div>
          <div className="summary-compact-value" style={{ color: 'var(--ios-green)' }}>
            {fmt(totais.receitas)}
          </div>
        </div>
        <div className="summary-compact-item">
          <div className="summary-compact-label">Despesas</div>
          <div className="summary-compact-value" style={{ color: 'var(--ios-red)' }}>
            {fmt(totais.despesas)}
          </div>
        </div>
        <div className="summary-compact-item">
          <div className="summary-compact-label">Saldo</div>
          <div className="summary-compact-value" style={{
            color: totais.saldo >= 0 ? 'var(--ios-green)' : 'var(--ios-red)'
          }}>
            {fmt(totais.saldo)}
          </div>
        </div>
      </div>

      <div className="section-title">Transações</div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">Nenhuma transação</div>
          <div className="empty-state-hint">Toque no + para adicionar</div>
        </div>
      ) : (
        <div className="transactions-list">
          {dayGroups.map(group => (
            <div key={group.dayKey} className="day-group">
              <div className="day-separator">
                <span className="day-label">{formatDayLabel(group.date)}</span>
                <span className="day-balance">
                  {fmt(group.balance)}
                </span>
              </div>
              <div className="day-card">
                {group.transactions.map(t => renderTransaction(t))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
