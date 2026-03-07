import React, { useState, useRef } from 'react'
import { useFinance } from '../context/FinanceContext'
import { extractTextFromPDF } from '../utils/pdfParser'
import { parseTransactions } from '../utils/smartParser'
import { analyzeWithAI } from '../utils/aiAnalyzer'

const API_KEY_STORAGE = 'plafin_openai_key'
const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function PDFImportModal({ onClose, mesSelecionado, anoSelecionado }) {
  const { state, dispatch, getTransacoesMes } = useFinance()

  const [step, setStep] = useState(1)
  const [tipoDoc, setTipoDoc] = useState('extrato')
  const [contaId, setContaId] = useState(state.contas[0]?.id || '')
  const [useAI, setUseAI] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [results, setResults] = useState([])
  const fileRef = useRef()

  const handleAnalyze = async () => {
    if (!file) { setError('Selecione um arquivo PDF'); return }
    if (!contaId) { setError('Selecione uma conta'); return }
    if (useAI && !apiKey.trim()) { setError('Informe a chave API da OpenAI'); return }

    setError('')
    if (useAI) localStorage.setItem(API_KEY_STORAGE, apiKey.trim())
    setStep(2)

    try {
      setProgress('Extraindo texto do PDF...')
      let lines
      try {
        lines = await extractTextFromPDF(file)
      } catch (pdfErr) {
        console.error('PDF extraction error:', pdfErr)
        throw new Error(
          'Erro ao ler o PDF. Verifique se o arquivo não está corrompido ou protegido por senha.'
        )
      }

      if (!lines || !lines.length) {
        throw new Error(
          'Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada ou estar vazio.'
        )
      }

      console.log(`[Plafin] ${lines.length} linhas extraídas do PDF`)

      let found

      if (useAI) {
        setProgress('Analisando com IA...')
        const rawText = lines.join('\n')
        found = await analyzeWithAI(rawText, tipoDoc, apiKey.trim())
      } else {
        setProgress('Identificando transações...')
        await new Promise(r => setTimeout(r, 200))
        found = parseTransactions(lines, tipoDoc)
      }

      if (!found || !found.length) {
        console.log('[Plafin] Primeiras 20 linhas do PDF:', lines.slice(0, 20))
        throw new Error(
          useAI
            ? 'A IA não identificou transações no documento.'
            : 'Nenhuma transação identificada no PDF.\n\nVerifique se selecionou o tipo correto (Extrato ou Fatura). Caso o formato seja incomum, tente a "Análise com IA".'
        )
      }

      console.log(`[Plafin] ${found.length} transações identificadas`)

      setProgress('Comparando com transações existentes...')
      const existing = getTransacoesMes(mesSelecionado, anoSelecionado)
      const compared = compareResults(found, existing)

      setResults(compared)
      setStep(3)
    } catch (err) {
      console.error('[Plafin] Import error:', err)
      setError(err.message || 'Erro ao processar o PDF')
      setStep(1)
    }
  }

  const compareResults = (found, existing) => {
    const used = new Set()

    return found.map((f, idx) => {
      const [diaStr, mesStr, anoStr] = (f.data || '').split('/')
      const dia = parseInt(diaStr) || 1
      const mes = (parseInt(mesStr) || 1) - 1
      const ano = parseInt(anoStr) || new Date().getFullYear()
      const isCredito = f.tipo === 'credito'

      const match = existing.find(e => {
        if (used.has(e.id)) return false
        const valorMatch = Math.abs(e.valor - f.valor) < 0.02
        if (!valorMatch) return false
        const existIsReceita = e.tipo.startsWith('receita')
        return isCredito === existIsReceita
      })

      if (match) used.add(match.id)

      return {
        _id: `imp_${idx}_${Date.now()}`,
        data: f.data,
        descricao: f.descricao || 'Sem descrição',
        valor: Math.abs(f.valor) || 0,
        tipoCredDeb: f.tipo,
        dia, mes, ano,
        status: match ? 'existente' : 'novo',
        matchedId: match?.id || null,
        matchedDesc: match?.descricao || null,
        selected: !match
      }
    })
  }

  const toggleItem = (id) => {
    setResults(prev => prev.map(r =>
      r._id === id ? { ...r, selected: !r.selected } : r
    ))
  }

  const handleImport = () => {
    const selected = results.filter(r => r.selected)

    selected.forEach((r, i) => {
      if (r.status === 'novo') {
        const txnId = `${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`
        dispatch({
          type: 'ADD_TRANSACAO',
          payload: {
            id: txnId,
            tipo: r.tipoCredDeb === 'credito' ? 'receita_variavel' : 'despesa_variavel',
            descricao: r.descricao,
            valor: r.valor,
            contaId,
            dia: r.dia,
            mes: r.mes,
            ano: r.ano,
            consolidadas: { [`${r.mes}-${r.ano}`]: true }
          }
        })
      } else if (r.status === 'existente' && r.matchedId) {
        dispatch({
          type: 'SET_CONSOLIDADA',
          payload: { id: r.matchedId, mes: mesSelecionado, ano: anoSelecionado, consolidada: true }
        })
      }
    })

    onClose()
  }

  const novos = results.filter(r => r.status === 'novo')
  const existentes = results.filter(r => r.status === 'existente')
  const newSelected = results.filter(r => r.selected && r.status === 'novo').length
  const existSelected = results.filter(r => r.selected && r.status === 'existente').length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {step === 1 && (
          <>
            <div className="modal-header-row">
              <h2 className="modal-title">📄 Importar PDF</h2>
            </div>

            {error && <div className="import-error" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

            <div className="modal-form">
              <div
                className={`pdf-drop-zone ${file ? 'has-file' : ''}`}
                onClick={() => fileRef.current?.click()}
              >
                {file ? (
                  <>
                    <span className="pdf-file-icon">📄</span>
                    <span className="pdf-file-name">{file.name}</span>
                    <span className="pdf-file-size">{(file.size / 1024).toFixed(0)} KB</span>
                  </>
                ) : (
                  <>
                    <span className="pdf-drop-icon">📎</span>
                    <span className="pdf-drop-text">Toque para selecionar o PDF</span>
                    <span className="pdf-drop-hint">Extrato bancário ou fatura de cartão</span>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={e => { setFile(e.target.files[0] || null); setError('') }}
                />
              </div>

              <div className="form-field">
                <label>Tipo do Documento</label>
                <select value={tipoDoc} onChange={e => setTipoDoc(e.target.value)}>
                  <option value="extrato">Extrato Bancário</option>
                  <option value="fatura">Fatura de Cartão de Crédito</option>
                </select>
              </div>

              <div className="form-field">
                <label>Conta</label>
                <select value={contaId} onChange={e => setContaId(e.target.value)}>
                  {state.contas.map(c => (
                    <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="import-mode-toggle">
                <button
                  className={`mode-btn ${!useAI ? 'active' : ''}`}
                  onClick={() => setUseAI(false)}
                >
                  Análise Local
                </button>
                <button
                  className={`mode-btn ${useAI ? 'active' : ''}`}
                  onClick={() => setUseAI(true)}
                >
                  Análise com IA
                </button>
              </div>

              {!useAI && (
                <div className="import-mode-hint">
                  Identifica transações automaticamente sem necessidade de chave API.
                  Funciona com a maioria dos extratos e faturas brasileiros.
                </div>
              )}

              {useAI && (
                <div className="form-field">
                  <label>Chave API OpenAI</label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                  />
                  <span className="form-hint">
                    Para documentos complexos. Obtenha em platform.openai.com
                  </span>
                </div>
              )}

              <button
                type="button"
                className="btn-submit"
                style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)' }}
                onClick={handleAnalyze}
              >
                Analisar PDF
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="import-processing">
            <div className="import-spinner" />
            <h3 className="import-progress-title">{progress}</h3>
            <p className="import-progress-hint">
              {useAI ? 'Isso pode levar alguns segundos...' : 'Processando localmente...'}
            </p>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="modal-header-row">
              <button className="modal-back" onClick={() => { setStep(1); setResults([]) }}>
                ‹ Voltar
              </button>
              <h2 className="modal-title">Prévia de Importação</h2>
            </div>

            <div className="import-summary-bar">
              <span className="import-badge novo">{novos.length} novos</span>
              <span className="import-badge existente">{existentes.length} já lançados</span>
            </div>

            <div className="import-results-list">
              {results.map(r => (
                <div
                  key={r._id}
                  className={`import-result-item ${r.status} ${r.selected ? 'selected' : ''}`}
                  onClick={() => toggleItem(r._id)}
                >
                  <div className={`import-check ${r.selected ? 'checked' : ''}`}>
                    {r.selected && '✓'}
                  </div>

                  <div className="import-result-info">
                    <div className="import-result-desc">{r.descricao}</div>
                    <div className="import-result-meta">
                      {r.data}
                      {r.status === 'existente' && r.matchedDesc && (
                        <span className="import-match-hint"> · "{r.matchedDesc}"</span>
                      )}
                    </div>
                  </div>

                  <div className="import-result-right">
                    <span className={`import-result-amount ${r.tipoCredDeb === 'credito' ? 'income' : 'expense'}`}>
                      {r.tipoCredDeb === 'credito' ? '+' : '-'}{fmt(r.valor)}
                    </span>
                    <span className={`import-status-badge ${r.status}`}>
                      {r.status === 'novo' ? 'Novo' : 'Lançado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {(newSelected > 0 || existSelected > 0) ? (
              <button
                type="button"
                className="btn-submit"
                style={{ background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)' }}
                onClick={handleImport}
              >
                {newSelected > 0 && `Importar ${newSelected}`}
                {newSelected > 0 && existSelected > 0 && ' · '}
                {existSelected > 0 && `Consolidar ${existSelected}`}
              </button>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--ios-text-secondary)', padding: 12, fontSize: 14 }}>
                Selecione as transações para importar ou consolidar
              </p>
            )}
          </>
        )}

        <button className="modal-close-btn" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}
