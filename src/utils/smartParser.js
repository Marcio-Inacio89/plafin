const DATE_RE = /(\d{2})[\/\-.](\d{2})(?:[\/\-.](\d{2,4}))?/

const VALUE_RE = /(\d{1,3}(?:\.\d{3})*,\d{2})/g

const SKIP_EXTRATO = /saldo\s*(anterior|atual|final|do\s*dia)|total\s*(geral|do)|subtotal|limite\s*(dispon|total|de\s*cr)|pagamento\s*m[ií]nimo|vencimento|data\s*de\s*corte|encerramento|rendimento\s*da\s*poupan/i

const SKIP_FATURA = /valor\s*total|saldo\s*(anterior|desta|total)|total\s*(desp|de\s*pag|de\s*cr[eé]d|a\s*pagar)|compra\s*data\s*descri|parcela\s+r\$|pagamento\s+total|pagamento\s+m[ií]nimo|limite\s*(dispon|total|utiliz)|melhor\s*dia|hist[oó]rico\s*de\s*fat|per[ií]odo\s*das\s*compras|anuidade\s*diferenciada|super\s*cr[eé]dito|saque\s*[àa]\s*cr[eé]dito|juros.*cet|compras\s*parcelad|obriga[çc][õo]es\s*fut/i

const FATURA_SECTION_HEADERS = /^(pagamento\s+e\s+demais|parcelamentos|despesas)\b/i

const FATURA_SKIP_LINES = /^(MARCIO|ANA\s|@\s*\w|4220\s*XXXX|\d{4}\s*XXXX|Detalhamento|Resumo\s*da|Descri[çc][aã]o|Cartão|TOTAL\b|ANUIDADE|DEMONSTR|Explore\s+desc|Acesse\s+o\s+site|O\s+VALOR\s+DA|Ol[aá],|ELITE\s+VISA|Sempre\s+a\s+sua|No\s+caso\s+de|Para\s+parcel|IMPORTANTE|Esta\s+fatura)/i

const CREDIT_WORDS = /pix\s*receb|cr[eé]dito|dep[oó]sito|ted\s*receb|doc\s*receb|sal[aá]rio|rendimento|estorno|devolu[cç][aã]o|resgate|receb|bonifica|reembols|transfer[eê]ncia\s*receb|juros\s*cr[eé]d/i

const DEBIT_WORDS = /pix\s*env|d[eé]bito|pagto|pgto|pagamento|tarifa|compra|saque|iof|taxa|boleto|transf.*env|anuidade|seguro|juros|multa|encargo|d[eé]b\s*aut/i

function parseValue(str) {
  return parseFloat(str.replace(/\./g, '').replace(',', '.'))
}

function cleanDescription(desc) {
  return desc
    .replace(/\b\d{2}\/\d{2}\b/g, '')
    .replace(/^[\s\-–—·:*]+/, '')
    .replace(/[\s\-–—·:]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function detectTipoExtrato(line, descricao, afterValue) {
  if (/^\s*[cC]\b/.test(afterValue)) return 'credito'
  if (/^\s*[dD]\b/.test(afterValue)) return 'debito'
  if (CREDIT_WORDS.test(descricao) || CREDIT_WORDS.test(line)) return 'credito'
  if (DEBIT_WORDS.test(descricao) || DEBIT_WORDS.test(line)) return 'debito'
  return 'debito'
}

export function parseTransactions(lines, tipoDoc) {
  if (tipoDoc === 'fatura') return parseFatura(lines)
  return parseExtrato(lines)
}

function inferFaturaInfo(lines) {
  let foundVencimento = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase()
    if (line === 'vencimento' || line.startsWith('vencimento')) {
      foundVencimento = true
    }
    if (foundVencimento || i < 30) {
      const m = lines[i].match(/(\d{2})\/(\d{2})\/(\d{4})/)
      if (m) {
        const d = parseInt(m[1]), mo = parseInt(m[2]), y = parseInt(m[3])
        if (y >= 2020 && y <= 2099 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
          return { day: d, month: mo, year: y }
        }
      }
    }
    if (foundVencimento && i > 40) break
  }
  const now = new Date()
  return { day: 1, month: now.getMonth() + 1, year: now.getFullYear() }
}

function smartYear(txnMonth, faturaMonth, faturaYear) {
  if (txnMonth > faturaMonth + 3) return faturaYear - 1
  return faturaYear
}

function parseFatura(lines) {
  const faturaInfo = inferFaturaInfo(lines)
  const vencData = `${String(faturaInfo.day).padStart(2, '0')}/${String(faturaInfo.month).padStart(2, '0')}/${faturaInfo.year}`

  const results = []
  let section = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.length < 6) continue

    const sectionMatch = line.match(FATURA_SECTION_HEADERS)
    if (sectionMatch) {
      const s = sectionMatch[1].toLowerCase()
      if (s.startsWith('pagamento')) section = 'pagamentos'
      else if (s.startsWith('parcelamento')) section = 'parcelamentos'
      else section = 'despesas'
      continue
    }

    if (SKIP_FATURA.test(line)) continue
    if (FATURA_SKIP_LINES.test(line)) continue

    const cleaned = line.replace(/^\d{1,2}\s{2,}/, '')

    const dateMatch = cleaned.match(DATE_RE)
    if (!dateMatch) continue

    const dia = parseInt(dateMatch[1])
    const mes = parseInt(dateMatch[2])
    if (dia < 1 || dia > 31 || mes < 1 || mes > 12) continue

    const anoStr = dateMatch[3]
    const origYear = anoStr
      ? (anoStr.length === 2 ? 2000 + parseInt(anoStr) : parseInt(anoStr))
      : smartYear(mes, faturaInfo.month, faturaInfo.year)
    const origDate = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${origYear}`

    const values = []
    const vRegex = new RegExp(VALUE_RE.source, 'g')
    let m
    while ((m = vRegex.exec(cleaned)) !== null) {
      const idx = m.index
      const hasNeg = idx > 0 && cleaned[idx - 1] === '-'
      const val = parseValue(m[1])
      if (val >= 0.01 && val < 9999999) {
        values.push({ value: val, negative: hasNeg, index: idx, length: m[0].length })
      }
    }

    if (values.length === 0) continue

    const txn = values[values.length - 1]

    const dateEnd = dateMatch.index + dateMatch[0].length
    let descricao = cleaned.substring(dateEnd, txn.index)
    descricao = cleanDescription(descricao)

    if (descricao.length < 2) continue

    const isNeg = txn.negative
    let tipo
    if (isNeg || section === 'pagamentos') {
      tipo = 'credito'
    } else if (/deb\s*autom|pagamento.*fatura/i.test(descricao)) {
      tipo = 'credito'
    } else {
      tipo = 'debito'
    }

    if (txn.value < 0.02 && tipo === 'credito') continue

    results.push({
      data: vencData,
      descricao: `${origDate} ${descricao}`.substring(0, 120),
      valor: txn.value,
      tipo
    })
  }

  return results
}

function parseExtrato(lines) {
  const year = new Date().getFullYear()
  const results = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.length < 8) continue
    if (SKIP_EXTRATO.test(line)) continue

    const dateMatch = line.match(DATE_RE)
    if (!dateMatch) continue

    const dia = parseInt(dateMatch[1])
    const mes = parseInt(dateMatch[2])
    if (dia < 1 || dia > 31 || mes < 1 || mes > 12) continue

    const anoStr = dateMatch[3]
    const fullYear = anoStr
      ? (anoStr.length === 2 ? 2000 + parseInt(anoStr) : parseInt(anoStr))
      : year

    const values = []
    const vRegex = new RegExp(VALUE_RE.source, 'g')
    let m
    while ((m = vRegex.exec(line)) !== null) {
      const val = parseValue(m[1])
      if (val > 0 && val < 9999999) {
        values.push({ value: val, index: m.index, length: m[0].length })
      }
    }

    if (values.length === 0) continue

    const txn = values[0]
    const dateEnd = dateMatch.index + dateMatch[0].length
    let descricao = line.substring(dateEnd, txn.index)
    descricao = cleanDescription(descricao)

    if (descricao.length < 2) {
      if (values.length > 1) {
        descricao = cleanDescription(line.substring(dateEnd, values[1].index))
        if (descricao.length >= 2) {
          const secondTxn = values[1]
          const afterVal = line.substring(secondTxn.index + secondTxn.length).trim()
          const tipo = detectTipoExtrato(line, descricao, afterVal)
          results.push({
            data: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${fullYear}`,
            descricao: descricao.substring(0, 100),
            valor: secondTxn.value,
            tipo
          })
          continue
        }
      }
      continue
    }

    const afterVal = line.substring(txn.index + txn.length).trim()
    const tipo = detectTipoExtrato(line, descricao, afterVal)

    results.push({
      data: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${fullYear}`,
      descricao: descricao.substring(0, 100),
      valor: txn.value,
      tipo
    })
  }

  return results
}
