import { ollamaGenerateJSON, ollamaStreamChat, ollamaEmbedBatch } from '@/lib/ai/ollama'
import { groqGenerateJSON, groqStreamChat, groqEmbedBatch } from '@/lib/ai/groq'

/**
 * Whether this deployment is using Groq (cloud) instead of Ollama (local).
 * Set GROQ_API_KEY in your environment (e.g. on Vercel) to use Groq.
 * Without it, the app falls back to a local Ollama server for development.
 */
export const usingGroq = !!process.env.GROQ_API_KEY

/**
 * True when running on Vercel (or similar) without a Groq key configured —
 * meaning any attempt to reach "localhost" Ollama is guaranteed to fail,
 * since there's no local Ollama server on a hosted deployment. Checking
 * this up front avoids a slow, doomed network timeout and gives a clear
 * message instead of a confusing "is Ollama running?" error to site visitors.
 */
const isHostedWithoutGroq = !usingGroq && !!process.env.VERCEL

const NOT_CONFIGURED_MESSAGE =
  'AI features aren\'t configured for this deployment yet. Add a GROQ_API_KEY environment variable in your hosting provider\'s settings and redeploy.'

export async function generateJSON<T>(
  prompt: string,
  system: string,
): Promise<T> {
  if (isHostedWithoutGroq) throw new Error(NOT_CONFIGURED_MESSAGE)
  return usingGroq
    ? groqGenerateJSON<T>(prompt, system)
    : ollamaGenerateJSON<T>(prompt, system)
}

export async function streamChat(prompt: string, system: string) {
  if (isHostedWithoutGroq) throw new Error(NOT_CONFIGURED_MESSAGE)
  return usingGroq
    ? groqStreamChat(prompt, system)
    : ollamaStreamChat(prompt, system)
}

/**
 * Returns semantic embedding vectors for a batch of strings (e.g. skill
 * names), in the same order. Used for meaning-based similarity instead of
 * literal text matching.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (isHostedWithoutGroq) throw new Error(NOT_CONFIGURED_MESSAGE)
  return usingGroq ? groqEmbedBatch(texts) : ollamaEmbedBatch(texts)
}
