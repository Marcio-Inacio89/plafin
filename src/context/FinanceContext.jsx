import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

const FinanceContext = createContext()
const STORAGE_KEY = 'plafin_data_v2'

const DEFAULT_CONTAS = [
  { id: 'carteira', nome: 'Carteira', cor: '#007AFF', icone: '👛' }
]

const initialState = { contas: DEFAULT_CONTAS, transacoes: [] }

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (!parsed.contas?.length) parsed.contas = DEFAULT_CONTAS
      if (!parsed.transacoes) parsed.transacoes = []
      return parsed
    }
    return initialState
  } catch {
    return initialState
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_CONTA':
      return { ...state, contas: [...state.contas, action.payload] }
    case 'REMOVE_CONTA': {
      if (state.contas.length <= 1) return state
      return {
        ...state,
        contas: state.contas.filter(c => c.id !== action.payload),
        transacoes: state.transacoes.filter(
          t => t.contaId !== action.payload && t.contaDestinoId !== action.payload
        )
      }
    }
    case 'ADD_TRANSACAO':
      return { ...state, transacoes: [...state.transacoes, action.payload] }
    case 'EDIT_TRANSACAO':
      return {
        ...state,
        transacoes: state.transacoes.map(t =>
          t.id === action.payload.id ? action.payload : t
        )
      }
    case 'REMOVE_TRANSACAO':
      return { ...state, transacoes: state.transacoes.filter(t => t.id !== action.payload) }
    case 'TOGGLE_CONSOLIDADA': {
      const { id, mes, ano } = action.payload
      const key = `${mes}-${ano}`
      return {
        ...state,
        transacoes: state.transacoes.map(t => {
          if (t.id !== id) return t
          const prev = t.consolidadas || {}
          const wasOn = prev[key]
          const next = { ...prev }
          if (wasOn) delete next[key]
          else next[key] = true
          return { ...t, consolidadas: next }
        })
      }
    }
    case 'SET_CONSOLIDADA': {
      const { id, mes, ano, consolidada } = action.payload
      const key = `${mes}-${ano}`
      return {
        ...state,
        transacoes: state.transacoes.map(t => {
          if (t.id !== id) return t
          const prev = t.consolidadas || {}
          const next = { ...prev }
          if (consolidada) next[key] = true
          else delete next[key]
          return { ...t, consolidadas: next }
        })
      }
    }
    default:
      return state
  }
}

const PERIODICIDADE_MULT = {
  semanal: 4.33,
  quinzenal: 2,
  mensal: 1,
  trimestral: 1 / 3,
  semestral: 1 / 6,
  anual: 1 / 12,
}

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const isFixedActiveInMonth = useCallback((t, mes, ano) => {
    const idx = ano * 12 + mes
    if (t.mesInicio != null && t.anoInicio != null) {
      if (idx < t.anoInicio * 12 + t.mesInicio) return false
    }
    if (t.mesFim != null && t.anoFim != null) {
      if (idx > t.anoFim * 12 + t.mesFim) return false
    }
    return true
  }, [])

  const getTransacoesMes = useCallback((mes, ano, contaFiltro = null) => {
    return state.transacoes.filter(t => {
      const isFixed = t.tipo === 'receita_fixa' || t.tipo === 'despesa_fixa'
      const matchMes = isFixed ? isFixedActiveInMonth(t, mes, ano) : (t.mes === mes && t.ano === ano)
      const matchConta = !contaFiltro || t.contaId === contaFiltro || t.contaDestinoId === contaFiltro
      return matchMes && matchConta
    })
  }, [state.transacoes, isFixedActiveInMonth])

  const getTotaisMes = useCallback((mes, ano, contaFiltro = null) => {
    const trans = getTransacoesMes(mes, ano, contaFiltro)
    let receitas = 0, despesas = 0

    trans.forEach(t => {
      if (t.tipo === 'transferencia') {
        if (contaFiltro) {
          if (t.contaId === contaFiltro) despesas += t.valor
          if (t.contaDestinoId === contaFiltro) receitas += t.valor
        }
      } else if (t.tipo.startsWith('receita')) {
        receitas += t.valor
      } else if (t.tipo.startsWith('despesa')) {
        despesas += t.valor
      }
    })

    return { receitas, despesas, saldo: receitas - despesas }
  }, [getTransacoesMes])

  const getProjecao = useCallback(() => {
    const fixas = state.transacoes.filter(
      t => t.tipo === 'receita_fixa' || t.tipo === 'despesa_fixa'
    )

    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const hoje = new Date()
    const meses = []
    let acumulado = 0
    let firstReceita = 0, firstDespesa = 0

    for (let i = 0; i < 12; i++) {
      const mesIdx = (hoje.getMonth() + i) % 12
      const ano = hoje.getFullYear() + Math.floor((hoje.getMonth() + i) / 12)

      let mesReceita = 0, mesDespesa = 0

      fixas.forEach(t => {
        if (!isFixedActiveInMonth(t, mesIdx, ano)) return
        const mult = PERIODICIDADE_MULT[t.periodicidade] || 1
        const valorMensal = t.valor * mult
        if (t.tipo === 'receita_fixa') mesReceita += valorMensal
        else mesDespesa += valorMensal
      })

      const varTrans = state.transacoes.filter(
        t => (t.tipo === 'receita_variavel' || t.tipo === 'despesa_variavel') &&
          t.mes === mesIdx && t.ano === ano
      )

      varTrans.forEach(t => {
        if (t.tipo === 'receita_variavel') mesReceita += t.valor
        else mesDespesa += t.valor
      })

      if (i === 0) { firstReceita = mesReceita; firstDespesa = mesDespesa }

      acumulado += (mesReceita - mesDespesa)
      meses.push({
        mes: `${nomesMeses[mesIdx]}/${ano}`,
        mesAbrev: nomesMeses[mesIdx],
        receitas: mesReceita,
        despesas: mesDespesa,
        saldo: mesReceita - mesDespesa,
        acumulado
      })
    }

    return { meses, receitaMensal: firstReceita, despesaMensal: firstDespesa, saldoMensal: firstReceita - firstDespesa }
  }, [state.transacoes, isFixedActiveInMonth])

  const getConta = useCallback((id) => {
    return state.contas.find(c => c.id === id)
  }, [state.contas])

  return (
    <FinanceContext.Provider value={{ state, dispatch, getTransacoesMes, getTotaisMes, getProjecao, getConta }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance deve ser usado dentro de FinanceProvider')
  return ctx
}
