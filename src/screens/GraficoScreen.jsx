import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useFinance } from '../context/FinanceContext'

const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  return (
    <div style={{
      background: 'rgba(255,255,255,0.96)', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontSize: 13, border: 'none'
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ color: value >= 0 ? '#34C759' : '#FF3B30', fontWeight: 600 }}>{fmt(value)}</p>
    </div>
  )
}

export default function GraficoScreen() {
  const { getProjecao } = useFinance()
  const { meses, receitaMensal, despesaMensal } = getProjecao()

  if (receitaMensal === 0 && despesaMensal === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-text">Sem dados para o gráfico</div>
        <div className="empty-state-hint">Adicione transações para ver o gráfico</div>
      </div>
    )
  }

  const lastVal = meses[meses.length - 1]?.acumulado || 0
  const positive = lastVal >= 0
  const color = positive ? '#34C759' : '#FF3B30'
  const rgb = positive ? '52,199,89' : '255,59,48'

  return (
    <div>
      <div className="chart-container">
        <div className="chart-title">Projeção de Saldo</div>
        <div className="chart-subtitle">Saldo acumulado para os próximos 12 meses</div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={meses} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`rgb(${rgb})`} stopOpacity={0.3} />
                <stop offset="95%" stopColor={`rgb(${rgb})`} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" vertical={false} />
            <XAxis dataKey="mesAbrev" axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: '#8E8E93' }} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: '#8E8E93' }}
              tickFormatter={v => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="acumulado" stroke={color} strokeWidth={2.5}
              fill="url(#grad)" dot={{ fill: color, strokeWidth: 0, r: 3 }}
              activeDot={{ fill: color, strokeWidth: 2, stroke: '#fff', r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: color }} />
            <span>Saldo Acumulado</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Projeção em 12 meses</div>
        <div style={{
          fontSize: 28, fontWeight: 700,
          color: positive ? 'var(--ios-green)' : 'var(--ios-red)'
        }}>
          {fmt(lastVal)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ios-text-secondary)', marginTop: 4 }}>
          Saldo acumulado estimado em {meses[meses.length - 1]?.mes}
        </div>
      </div>
    </div>
  )
}
