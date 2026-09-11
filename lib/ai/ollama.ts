const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'

/**
 * Calls the local Ollama server and returns the raw text response.
 * Throws if Ollama isn't reachable (e.g. not running on the user's machine).
 */
export async function ollamaGenerate(
  prompt: string,
  system?: string,
  opts?: { json?: boolean; numPredict?: number },
) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      system,
      stream: false,
      // Ollama's native structured-output mode: constrains sampling so the
      // model can only produce syntactically valid JSON. Much more reliable
      // than just asking nicely in the prompt.
      ...(opts?.json ? { format: 'json' } : {}),
      options: {
        // Give enough room for longer structured responses (e.g. a full
        // multi-phase roadmap) so they don't get cut off mid-array/object,
        // which is the most common cause of "invalid JSON" errors.
        num_predict: opts?.numPredict ?? 1024,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(
      `Ollama request failed (${res.status}). Is "ollama serve" running on this machine?`,
    )
  }

  const data = await res.json()
  return data.response as string
}

/**
 * Starts a streaming chat completion with Ollama. Validates the connection
 * (throws immediately) before returning the async generator.
 */
export async function ollamaStreamChat(prompt: string, system: string) {
  let res: Response
  try {
    res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        system,
        stream: true,
      }),
    })
  } catch {
    throw new Error(
      'Could not reach Ollama. Make sure "ollama serve" is running on this machine.',
    )
  }

  if (!res.ok || !res.body) {
    throw new Error(`Ollama request failed (${res.status}).`)
  }

  return parseOllamaStream(res.body)
}

async function* parseOllamaStream(body: ReadableStream<Uint8Array>) {
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
      if (!line.trim()) continue
      try {
        const json = JSON.parse(line)
        if (json.response) yield json.response as string
      } catch {
        // ignore malformed line
      }
    }
  }
}

/**
 * Calls Ollama and asks it to return ONLY JSON matching the given shape.
 * Uses Ollama's native JSON mode (constrains output to valid JSON syntax)
 * and repairs common minor formatting issues before parsing.
 */
export async function ollamaGenerateJSON<T>(
  prompt: string,
  system: string,
): Promise<T> {
  const strictSystem = `${system}\n\nCRITICAL: Respond with ONLY valid JSON. No markdown code fences, no preamble, no explanation — just the raw JSON object.`

  const raw = await ollamaGenerate(prompt, strictSystem, {
    json: true,
    numPredict: 2048,
  })

  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```$/, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Try common repairs: trailing commas before ] or }, which local models
    // occasionally produce even in JSON mode.
    const repaired = cleaned.replace(/,(\s*[\]}])/g, '$1')
    try {
      return JSON.parse(repaired) as T
    } catch {
      // Some models wrap JSON in extra text — try extracting the {...} block
      const match = repaired.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          return JSON.parse(match[0]) as T
        } catch {
          // fall through to final error below
        }
      }
      throw new Error(
        'Ollama did not return valid JSON: ' + cleaned.slice(0, 200),
      )
    }
  }
}

const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'

/**
 * Returns embedding vectors for a batch of strings, in the same order.
 * Requires the embedding model to be pulled locally:
 *   ollama pull nomic-embed-text
 */
export async function ollamaEmbedBatch(texts: string[]): Promise<number[][]> {
  if (!texts.length) return []

  const vectors: number[][] = []
  for (const text of texts) {
    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt: text }),
    })

    if (!res.ok) {
      throw new Error(
        `Ollama embeddings request failed (${res.status}). Make sure you've run ` +
          `"ollama pull ${OLLAMA_EMBED_MODEL}".`,
      )
    }

    const data = await res.json()
    vectors.push(data.embedding as number[])
  }
  return vectors
}
