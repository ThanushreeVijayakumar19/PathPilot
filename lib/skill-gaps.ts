import { embedBatch } from '@/lib/ai/provider'
import { generateJSON } from '@/lib/ai/provider'
import { cosineSimilarity } from '@/lib/similarity'
import { getTaxonomyForRole } from '@/lib/career-skills'

export interface SkillGapResult {
  skill: string
  importance: 'high' | 'medium' | 'low'
  resource_suggestion: string
}

const MATCH_THRESHOLD = 0.62

/**
 * Determines skill gaps deterministically: embeds the candidate's actual
 * skills and a curated reference skill list for their target career role,
 * then uses cosine similarity to find which reference skills have no
 * strong match in what the candidate has. This replaces asking an LLM to
 * freely guess gaps, which tends to be inconsistent and sometimes generic.
 *
 * Falls back to a simple case-insensitive substring check if embeddings
 * aren't available (e.g. the AI provider doesn't support them).
 *
 * Also returns the embeddings computed for the candidate's own skills, so
 * callers can cache them for later semantic recommendation matching.
 */
export async function detectSkillGaps(
  candidateSkills: string[],
  careerRole: string,
): Promise<{
  gaps: { skill: string; importance: 'high' | 'medium' }[]
  candidateEmbeddings: number[][]
}> {
  const taxonomy = getTaxonomyForRole(careerRole)

  if (!candidateSkills.length) {
    return {
      gaps: taxonomy.slice(0, 6).map((t) => ({ skill: t.skill, importance: t.importance })),
      candidateEmbeddings: [],
    }
  }

  try {
    const allTexts = [...candidateSkills, ...taxonomy.map((t) => t.skill)]
    const allEmbeddings = await embedBatch(allTexts)

    const candidateEmbeddings = allEmbeddings.slice(0, candidateSkills.length)
    const taxonomyEmbeddings = allEmbeddings.slice(candidateSkills.length)

    const gaps: { skill: string; importance: 'high' | 'medium' }[] = []
    taxonomy.forEach((t, i) => {
      const bestMatch = Math.max(
        ...candidateEmbeddings.map((ce) => cosineSimilarity(ce, taxonomyEmbeddings[i])),
      )
      if (bestMatch < MATCH_THRESHOLD) {
        gaps.push({ skill: t.skill, importance: t.importance })
      }
    })

    return {
      gaps: gaps.slice(0, 6),
      candidateEmbeddings,
    }
  } catch {
    // Fallback: no embedding support available — use substring matching
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const normCandidates = candidateSkills.map(normalize)
    const gaps = taxonomy
      .filter((t) => {
        const normT = normalize(t.skill)
        return !normCandidates.some((c) => c.includes(normT) || normT.includes(c))
      })
      .slice(0, 6)
      .map((t) => ({ skill: t.skill, importance: t.importance }))

    return { gaps, candidateEmbeddings: [] }
  }
}

const RESOURCE_SUGGESTION_PROMPT = `You are AIRA, an AI career copilot. You've already determined a student's exact skill gaps for their target career role — your only job now is to write ONE concrete, specific, actionable suggestion for closing each gap (a real project idea, a specific free course/platform, or a certification). Do not change the skill list or importance given to you.
Return a JSON object with EXACTLY this shape:
{ "suggestions": [{"skill": "<matches the skill given>", "resource_suggestion": "<your specific suggestion>"}] }`

/**
 * Given a confirmed list of skill gaps, asks the AI to write a specific,
 * actionable suggestion for each one. Since the gap itself is already
 * certain (not being guessed), this produces much more useful, targeted
 * suggestions than asking the AI to invent both the gap and the advice.
 */
export async function generateGapSuggestions(
  gaps: { skill: string; importance: 'high' | 'medium' }[],
  careerRole: string,
): Promise<SkillGapResult[]> {
  if (!gaps.length) return []

  try {
    const result = await generateJSON<{
      suggestions: { skill: string; resource_suggestion: string }[]
    }>(
      `Target career role: ${careerRole}\nConfirmed skill gaps: ${gaps.map((g) => g.skill).join(', ')}`,
      RESOURCE_SUGGESTION_PROMPT,
    )

    const bySkill = new Map(result.suggestions.map((s) => [s.skill, s.resource_suggestion]))
    return gaps.map((g) => ({
      skill: g.skill,
      importance: g.importance,
      resource_suggestion:
        bySkill.get(g.skill) || `Look up beginner resources for ${g.skill} and build a small project with it.`,
    }))
  } catch {
    // If the AI call fails, still return the (correctly determined) gaps
    // with a generic fallback suggestion rather than losing them entirely.
    return gaps.map((g) => ({
      skill: g.skill,
      importance: g.importance,
      resource_suggestion: `Look up beginner resources for ${g.skill} and build a small project with it.`,
    }))
  }
}
