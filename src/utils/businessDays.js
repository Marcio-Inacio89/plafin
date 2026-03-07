/**
 * Cálculo de dias úteis com feriados nacionais brasileiros.
 * Receita fixa em dia não útil → antecipa para dia útil anterior.
 * Despesa fixa em dia não útil → adia para próximo dia útil.
 */

function getEaster(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

const cache = {}

function getHolidays(year) {
  if (cache[year]) return cache[year]

  const set = new Set()
  const key = (m, d) =>
    `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const keyDate = (dt) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

  // Feriados fixos nacionais
  set.add(key(0, 1))    // Confraternização Universal
  set.add(key(3, 21))   // Tiradentes
  set.add(key(4, 1))    // Dia do Trabalho
  set.add(key(8, 7))    // Independência do Brasil
  set.add(key(9, 12))   // Nossa Senhora Aparecida
  set.add(key(10, 2))   // Finados
  set.add(key(10, 15))  // Proclamação da República
  set.add(key(10, 20))  // Consciência Negra
  set.add(key(11, 25))  // Natal

  // Feriados móveis (baseados na Páscoa)
  const easter = getEaster(year)
  const offset = (days) => {
    const d = new Date(easter)
    d.setDate(d.getDate() + days)
    return d
  }

  set.add(keyDate(offset(-48))) // Segunda de Carnaval
  set.add(keyDate(offset(-47))) // Terça de Carnaval
  set.add(keyDate(offset(-2)))  // Sexta-feira Santa
  set.add(keyDate(offset(60)))  // Corpus Christi

  cache[year] = set
  return set
}

export function isBusinessDay(date) {
  const dow = date.getDay()
  if (dow === 0 || dow === 6) return false
  const holidays = getHolidays(date.getFullYear())
  const k = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return !holidays.has(k)
}

export function previousBusinessDay(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  while (!isBusinessDay(d)) d.setDate(d.getDate() - 1)
  return d
}

export function nextBusinessDay(date) {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  while (!isBusinessDay(d)) d.setDate(d.getDate() + 1)
  return d
}

/**
 * Ajusta a data de vencimento para dia útil.
 * @param {number} dia - Dia do vencimento (1-31)
 * @param {number} mes - Mês (0-11)
 * @param {number} ano - Ano
 * @param {string} tipo - 'receita_fixa' (antecipa) ou 'despesa_fixa' (adia)
 * @returns {{ date: Date, original: Date, adjusted: boolean, direction: string|null }}
 */
export function adjustDate(dia, mes, ano, tipo) {
  const lastDay = new Date(ano, mes + 1, 0).getDate()
  const actualDay = Math.min(dia, lastDay)
  const original = new Date(ano, mes, actualDay)

  if (isBusinessDay(original)) {
    return { date: original, original, adjusted: false, direction: null }
  }

  if (tipo === 'receita_fixa') {
    return {
      date: previousBusinessDay(original),
      original,
      adjusted: true,
      direction: 'antecipado'
    }
  }

  return {
    date: nextBusinessDay(original),
    original,
    adjusted: true,
    direction: 'adiado'
  }
}

const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function formatDateShort(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${MESES_CURTO[date.getMonth()]}`
}
