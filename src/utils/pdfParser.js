import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

if (typeof ReadableStream !== 'undefined' &&
    !ReadableStream.prototype[Symbol.asyncIterator]) {
  ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) return
        yield value
      }
    } finally {
      reader.releaseLock()
    }
  }
}

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

function withTimeout(promise, ms) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('TIMEOUT')), ms)
    })
  ]).finally(() => clearTimeout(timer))
}

async function loadPDF(data) {
  try {
    return await withTimeout(pdfjsLib.getDocument({ data }).promise, 15000)
  } catch (e) {
    console.warn('[Plafin] Worker falhou, tentando sem worker:', e.message)
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''
    return await withTimeout(pdfjsLib.getDocument({ data }).promise, 15000)
  }
}

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)

  let pdf
  try {
    pdf = await loadPDF(data)
  } catch {
    throw new Error(
      'Erro ao ler o PDF. Verifique se o arquivo não está corrompido ou protegido.'
    )
  }

  const allLines = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    const lineMap = new Map()
    for (const item of textContent.items) {
      if (!item.str.trim()) continue
      const y = Math.round(item.transform[5])
      let assignedKey = null
      for (const [key] of lineMap) {
        if (Math.abs(key - y) < 5) { assignedKey = key; break }
      }
      const key = assignedKey ?? y
      if (!lineMap.has(key)) lineMap.set(key, [])
      lineMap.get(key).push({ x: item.transform[4], str: item.str })
    }

    const sortedKeys = [...lineMap.keys()].sort((a, b) => b - a)
    for (const key of sortedKeys) {
      const items = lineMap.get(key).sort((a, b) => a.x - b.x)
      const line = items.map(it => it.str).join('  ').replace(/\s{3,}/g, '  ').trim()
      if (line.length > 2) allLines.push(line)
    }
  }

  return allLines
}

export async function extractRawText(file) {
  const lines = await extractTextFromPDF(file)
  return lines.join('\n')
}
