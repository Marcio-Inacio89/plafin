import React from 'react'
import { useFinance } from '../context/FinanceContext'

const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtC = (v) => v.toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0
})

export default function ProjecaoScreen() {
  const { getProjecao } = useFinance()
  const { meses, receitaMensal, despesaMensal, saldoMensal } = getProjecao()

  if (receitaMensal === 0 && despesaMensal === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-text">Sem dados para projeção</div>
        <div className="empty-state-hint">Adicione transações para ver a projeção</div>
      </div>
    )
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Saldo Mensal Recorrente</div>
        <div style={{
          fontSize: 28, fontWeight: 700,
          color: saldoMensal >= 0 ? 'var(--ios-green)' : 'var(--ios-red)'
        }}>
          {fmt(saldoMensal)}
        </div>
      </div>

      <div className="section-title">Próximos 12 Meses</div>

      <div className="projection-table">
        <div className="projection-header">
          <span>Mês</span>
          <span>Receita</span>
          <span>Despesa</span>
          <span>Acumulado</span>
        </div>
        {meses.map((m, i) => (
          <div key={i} className="projection-row">
            <span className="mes">{m.mes}</span>
            <span style={{ color: 'var(--ios-green)' }}>{fmtC(m.receitas)}</span>
            <span style={{ color: 'var(--ios-red)' }}>{fmtC(m.despesas)}</span>
            <span className={m.acumulado >= 0 ? 'positive' : 'negative'}>
              {fmtC(m.acumulado)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
