const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

export async function analyzeWithAI(text, tipoDoc, apiKey) {
  const tipoLabel = tipoDoc === 'extrato'
    ? 'extrato bancário' : 'fatura de cartão de crédito'
  const anoAtual = new Date().getFullYear()

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em analisar documentos financeiros brasileiros. Extraia transações e retorne APENAS JSON válido.'
        },
        {
          role: 'user',
          content: `Analise o texto a seguir, extraído de um ${tipoLabel} brasileiro.

Identifique TODAS as transações financeiras (créditos e débitos).

Para cada transação, retorne:
- data: "DD/MM/YYYY" (se o ano não estiver explícito, use ${anoAtual})
- descricao: descrição limpa e legível (sem códigos internos ou números de autorização)
- valor: número positivo (valor absoluto, use ponto para decimais, ex: 1234.56)
- tipo: "credito" para entradas/recebimentos/depósitos, "debito" para saídas/pagamentos/compras/tarifas

Regras:
- Ignore linhas de saldo, totais, cabeçalhos e rodapés
- Cada transação deve ser um item separado
- Valores sempre positivos

Retorne SOMENTE um JSON array. Sem markdown, sem explicações, sem texto adicional.
Formato: [{"data":"DD/MM/YYYY","descricao":"...","valor":0.00,"tipo":"credito|debito"}]

Texto do documento:
${text}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('Chave API inválida. Verifique sua chave OpenAI.')
    if (response.status === 429) throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.')
    throw new Error(`Erro na API OpenAI: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  let jsonStr = content.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    const parsed = JSON.parse(jsonStr)
    if (!Array.isArray(parsed)) throw new Error('Resposta não é um array')
    return parsed
  } catch {
    throw new Error('Não foi possível interpretar a resposta da IA. Tente novamente.')
  }
}
