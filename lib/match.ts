import { cosineSimilarity } from '@/lib/similarity'

export interface MatchDetails {
  score: number
  matched: string[]
  missing: string[]
}

const SEMANTIC_MATCH_THRESHOLD = 0.62

/**
 * Like computeMatchDetails, but uses precomputed embedding vectors for
 * semantic (meaning-based) similarity instead of literal text matching —
 * so "React" correctly matches something like "frontend framework
 * experience" instead of requiring an exact/substring match.
 * Falls back to computeMatchDetails if embeddings aren't available for
 * either side (e.g. older rows generated before embeddings were added).
 */
export function computeMatchDetailsSemantic(
  userSkills: string[],
  userEmbeddings: number[][],
  requiredSkills: string[],
  requiredEmbeddings: number[][],
): MatchDetails {
  if (!requiredSkills.length) return { score: 0, matched: [], missing: [] }

  if (
    !userEmbeddings.length ||
    !requiredEmbeddings.length ||
    userEmbeddings.length !== userSkills.length ||
    requiredEmbeddings.length !== requiredSkills.length
  ) {
    return computeMatchDetails(userSkills, requiredSkills)
  }

  const matched: string[] = []
  const missing: string[] = []

  requiredSkills.forEach((req, i) => {
    const best = Math.max(
      ...userEmbeddings.map((ue) => cosineSimilarity(ue, requiredEmbeddings[i])),
    )
    if (best >= SEMANTIC_MATCH_THRESHOLD) matched.push(req)
    else missing.push(req)
  })

  return {
    score: Math.round((matched.length / requiredSkills.length) * 100),
    matched,
    missing,
  }
}

/**
 * Like computeMatchScore, but also returns which required skills the
 * candidate has and which ones they're missing — so the UI can show
 * "You have X, Y — still need Z" instead of just a bare percentage.
 */
export function computeMatchDetails(
  userSkills: string[],
  requiredSkills: string[],
): MatchDetails {
  if (!requiredSkills.length) return { score: 0, matched: [], missing: [] }

  const normalize = (s: string) =>
    s.toLowerCase().replace(/\.js$/, '').replace(/[^a-z0-9+#]/g, '')

  const userSet = userSkills.map(normalize)

  const matched: string[] = []
  const missing: string[] = []

  for (const req of requiredSkills) {
    const normReq = normalize(req)
    const hasIt = userSet.some(
      (u) => u === normReq || u.includes(normReq) || normReq.includes(u),
    )
    if (hasIt) matched.push(req)
    else missing.push(req)
  }

  return {
    score: Math.round((matched.length / requiredSkills.length) * 100),
    matched,
    missing,
  }
}

/**
 * Computes a 0-100 match score between a candidate's extracted skills and
 * an internship's required skills. Rule-based (no AI needed) — case
 * insensitive, and tolerant of near-matches like "React" vs "React.js".
 */
export function computeMatchScore(
  userSkills: string[],
  requiredSkills: string[],
): number {
  return computeMatchDetails(userSkills, requiredSkills).score
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  const days = Math.floor(seconds / 86400)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  return `${months} months ago`
}
