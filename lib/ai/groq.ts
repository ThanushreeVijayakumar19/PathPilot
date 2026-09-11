const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

function cleanJson(raw: string) {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```$/, '')
    .trim()
}

export async function groqGenerateJSON<T>(
  prompt: string,
  system: string,
): Promise<T> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `${system}\n\nCRITICAL: Respond with ONLY valid JSON. No markdown code fences, no preamble.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Groq request failed (${res.status}). ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? ''
  const cleaned = cleanJson(raw)

  try {
    return JSON.parse(cleaned) as T
  } catch {
    const repaired = cleaned.replace(/,(\s*[\]}])/g, '$1')
    try {
      return JSON.parse(repaired) as T
    } catch {
      const match = repaired.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0]) as T
      throw new Error('Groq did not return valid JSON: ' + cleaned.slice(0, 200))
    }
  }
}

/**
 * Starts a streaming chat completion with Groq. Validates the connection
 * (throws immediately) before returning the async generator, so callers can
 * return a proper error response instead of streaming a broken response.
 */
export async function groqStreamChat(prompt: string, system: string) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      stream: true,
    }),
  })

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Groq request failed (${res.status}). ${errText.slice(0, 200)}`)
  }

  return parseGroqSSE(res.body)
}

async function* parseGroqSSE(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) yield delta as string
      } catch {
        // ignore malformed chunk
      }
    }
  }
}

const GROQ_EMBED_URL = 'https://api.groq.com/openai/v1/embeddings'
const GROQ_EMBED_MODEL = process.env.GROQ_EMBED_MODEL || 'nomic-embed-text-v1_5'

/**
 * Returns embedding vectors for a batch of strings, in the same order.
 * Used for semantic (meaning-based) similarity instead of literal text
 * matching — e.g. so "React" and "frontend framework" register as related.
 */
export async function groqEmbedBatch(texts: string[]): Promise<number[][]> {
  if (!texts.length) return []

  const res = await fetch(GROQ_EMBED_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_EMBED_MODEL,
      input: texts,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Groq embeddings request failed (${res.status}). ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const sorted = [...data.data].sort((a, b) => a.index - b.index)
  return sorted.map((d) => d.embedding as number[])
}
