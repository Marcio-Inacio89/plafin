import React, { useState } from 'react'
import { useFinance } from '../context/FinanceContext'

const TIPOS = [
  { id: 'receita_fixa', label: 'Receita Fixa', icon: '💰', cor: '#34C759' },
  { id: 'receita_variavel', label: 'Receita Variável', icon: '💵', cor: '#30D158' },
  { id: 'despesa_fixa', label: 'Despesa Fixa', icon: '💳', cor: '#FF3B30' },
  { id: 'despesa_variavel', label: 'Despesa Variável', icon: '🛒', cor: '#FF6961' },
  { id: 'transferencia', label: 'Transferência', icon: '🔄', cor: '#007AFF' },
]

const PERIODICIDADES = [
  { id: 'mensal', label: 'Mensal' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'quinzenal', label: 'Quinzenal' },
  { id: 'trimestral', label: 'Trimestral' },
  { id: 'semestral', label: 'Semestral' },
  { id: 'anual', label: 'Anual' },
]

function buildDateISO(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function AddTransactionModal({ onClose, editData, mesSelecionado, anoSelecionado, onOpenPDFImport }) {
  const { state, dispatch } = useFinance()
  const isEditing = !!editData

  const initTipo = editData?.tipo || ''
  const initFixed = initTipo === 'receita_fixa' || initTipo === 'despesa_fixa'

  const [step, setStep] = useState(isEditing ? 2 : 1)
  const [tipo, setTipo] = useState(initTipo)
  const [descricao, setDescricao] = useState(editData?.descricao || '')
  const [valor, setValor] = useState(editData?.valor?.toString() || '')
  const [contaId, setContaId] = useState(editData?.contaId || state.contas[0]?.id || '')
  const [contaDestinoId, setContaDestinoId] = useState(editData?.contaDestinoId || '')
  const [periodicidade, setPeriodicidade] = useState(editData?.periodicidade || 'mensal')
  const [diaVencimento, setDiaVencimento] = useState(editData?.diaVencimento || new Date().getDate())

  const [mesInicio, setMesInicio] = useState(() => {
    if (editData?.mesInicio != null) return editData.mesInicio
    return mesSelecionado ?? new Date().getMonth()
  })
  const [anoInicio, setAnoInicio] = useState(() => {
    if (editData?.anoInicio != null) return editData.anoInicio
    return anoSelecionado ?? new Date().getFullYear()
  })
  const [temFim, setTemFim] = useState(() => editData?.mesFim != null)
  const [mesFim, setMesFim] = useState(() => editData?.mesFim ?? new Date().getMonth())
  const [anoFim, setAnoFim] = useState(() => editData?.anoFim ?? new Date().getFullYear())

  const [dataRef, setDataRef] = useState(() => {
    if (editData && !initFixed) {
      return buildDateISO(
        editData.ano || new Date().getFullYear(),
        (editData.mes != null ? editData.mes : new Date().getMonth()) + 1,
        editData.dia || new Date().getDate()
      )
    }
    const now = new Date()
    return buildDateISO(
      anoSelecionado ?? now.getFullYear(),
      (mesSelecionado ?? now.getMonth()) + 1,
      now.getDate()
    )
  })

  const isFixed = tipo === 'receita_fixa' || tipo === 'despesa_fixa'
  const isTransfer = tipo === 'transferencia'
  const tipoInfo = TIPOS.find(t => t.id === tipo)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!descricao.trim() || !valor || !contaId) return
    if (isTransfer && (!contaDestinoId || contaId === contaDestinoId)) return

    const [anoRef, mesRef, diaRef] = dataRef.split('-').map(Number)

    const transacao = {
      id: isEditing ? editData.id : Date.now().toString(),
      tipo,
      descricao: descricao.trim(),
      valor: parseFloat(valor),
      contaId,
      ...(isEditing && { consolidada: editData.consolidada || false }),
      ...(isTransfer && { contaDestinoId }),
      ...(isFixed && {
        periodicidade,
        diaVencimento: parseInt(diaVencimento) || 1,
        mesInicio, anoInicio,
        ...(temFim ? { mesFim, anoFim } : {}),
      }),
      ...(!isFixed && { dia: diaRef, mes: mesRef - 1, ano: anoRef }),
    }

    dispatch({ type: isEditing ? 'EDIT_TRANSACAO' : 'ADD_TRANSACAO', payload: transacao })
    onClose()
  }

  const handleDelete = () => {
    if (!editData) return
    dispatch({ type: 'REMOVE_TRANSACAO', payload: editData.id })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {step === 1 ? (
          <>
            <h2 className="modal-title">Nova Transação</h2>
            <div className="type-grid">
              {TIPOS.map(t => (
                <button
                  key={t.id}
                  className="type-card"
                  onClick={() => { setTipo(t.id); setStep(2) }}
                  style={{ '--type-color': t.cor }}
                >
                  <span className="type-icon">{t.icon}</span>
                  <span className="type-label">{t.label}</span>
                </button>
              ))}
              {onOpenPDFImport && (
                <button
                  className="type-card type-card-import"
                  onClick={onOpenPDFImport}
                  style={{ '--type-color': '#5856D6' }}
                >
                  <span className="type-icon">📄</span>
                  <span className="type-label">Importar PDF</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="modal-header-row">
              {!isEditing && (
                <button className="modal-back" onClick={() => setStep(1)}>‹ Voltar</button>
              )}
              <h2 className="modal-title">
                {tipoInfo?.icon} {isEditing ? 'Editar' : ''} {tipoInfo?.label}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-field">
                <label>Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Salário, Aluguel, Mercado..."
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>{isTransfer ? 'Conta Origem' : 'Conta'}</label>
                <select value={contaId} onChange={e => setContaId(e.target.value)}>
                  {state.contas.map(c => (
                    <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>
                  ))}
                </select>
              </div>

              {isFixed && (
                <>
                  <div className="form-field">
                    <label>Periodicidade</label>
                    <select value={periodicidade} onChange={e => setPeriodicidade(e.target.value)}>
                      {PERIODICIDADES.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Dia do Vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={diaVencimento}
                      onChange={e => setDiaVencimento(e.target.value)}
                      placeholder="Dia do mês (1-31)"
                    />
                    <span className="form-hint">
                      {tipo === 'receita_fixa'
                        ? 'Se cair em dia não útil, será antecipado'
                        : 'Se cair em dia não útil, será adiado'}
                    </span>
                  </div>
                  <div className="form-row-inline">
                    <div className="form-field">
                      <label>Mês Início</label>
                      <input
                        type="month"
                        value={`${anoInicio}-${String(mesInicio + 1).padStart(2, '0')}`}
                        onChange={e => {
                          const [y, m] = e.target.value.split('-').map(Number)
                          setMesInicio(m - 1)
                          setAnoInicio(y)
                        }}
                      />
                    </div>
                    <div className="form-field">
                      <label>Mês Término</label>
                      {temFim ? (
                        <input
                          type="month"
                          value={`${anoFim}-${String(mesFim + 1).padStart(2, '0')}`}
                          onChange={e => {
                            const [y, m] = e.target.value.split('-').map(Number)
                            setMesFim(m - 1)
                            setAnoFim(y)
                          }}
                        />
                      ) : (
                        <input type="text" value="Sem término" disabled className="input-disabled" />
                      )}
                      <div className="form-check-row">
                        <input
                          type="checkbox"
                          id="temFim"
                          checked={temFim}
                          onChange={e => setTemFim(e.target.checked)}
                        />
                        <label htmlFor="temFim">Definir término</label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isTransfer && (
                <div className="form-field">
                  <label>Conta Destino</label>
                  <select value={contaDestinoId} onChange={e => setContaDestinoId(e.target.value)}>
                    <option value="">Selecione a conta destino...</option>
                    {state.contas.filter(c => c.id !== contaId).map(c => (
                      <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {!isFixed && (
                <div className="form-field">
                  <label>Data</label>
                  <input
                    type="date"
                    value={dataRef}
                    onChange={e => setDataRef(e.target.value)}
                  />
                </div>
              )}

              <button type="submit" className="btn-submit" style={{ background: tipoInfo?.cor }}>
                {isEditing ? 'Salvar Alterações' : `Adicionar ${tipoInfo?.label}`}
              </button>

              {isEditing && (
                <button type="button" className="btn-delete-transaction" onClick={handleDelete}>
                  Excluir Transação
                </button>
              )}
            </form>
          </>
        )}

        <button className="modal-close-btn" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}
