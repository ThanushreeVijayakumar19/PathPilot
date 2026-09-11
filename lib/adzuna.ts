const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY
const ADZUNA_COUNTRY = process.env.ADZUNA_COUNTRY || 'in' // India by default

export interface AdzunaJob {
  title: string
  company: string
  location: string
  description: string
  salaryMin: number | null
  salaryMax: number | null
  applyUrl: string
  postedAt: string
}

export const adzunaConfigured = !!ADZUNA_APP_ID && !!ADZUNA_APP_KEY

/**
 * Searches Adzuna's real job listings (adzuna.in covers India). Returns
 * normalized job objects. Throws if Adzuna isn't configured or the request
 * fails, so callers can fall back gracefully.
 */
export async function searchAdzunaJobs(
  query: string,
  opts?: { resultsPerPage?: number; maxDaysOld?: number },
): Promise<AdzunaJob[]> {
  if (!adzunaConfigured) {
    throw new Error('Adzuna is not configured (missing ADZUNA_APP_ID/ADZUNA_APP_KEY).')
  }

  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID!,
    app_key: ADZUNA_APP_KEY!,
    what: query,
    results_per_page: String(opts?.resultsPerPage ?? 15),
    'content-type': 'application/json',
    sort_by: 'date',
  })
  if (opts?.maxDaysOld) params.set('max_days_old', String(opts.maxDaysOld))

  const url = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/1?${params.toString()}`

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Adzuna request failed (${res.status}). ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const results = Array.isArray(data.results) ? data.results : []

  return results.map((r: any) => ({
    title: r.title ?? 'Untitled role',
    company: r.company?.display_name ?? 'Unknown company',
    location: r.location?.display_name ?? ADZUNA_COUNTRY.toUpperCase(),
    description: (r.description ?? '').replace(/\s+/g, ' ').trim(),
    salaryMin: typeof r.salary_min === 'number' ? r.salary_min : null,
    salaryMax: typeof r.salary_max === 'number' ? r.salary_max : null,
    applyUrl: r.redirect_url ?? '',
    postedAt: r.created ?? new Date().toISOString(),
  }))
}

export function formatStipend(job: AdzunaJob): string {
  if (job.salaryMin && job.salaryMax) {
    return `₹${Math.round(job.salaryMin).toLocaleString('en-IN')} - ₹${Math.round(job.salaryMax).toLocaleString('en-IN')}/yr`
  }
  if (job.salaryMin) {
    return `From ₹${Math.round(job.salaryMin).toLocaleString('en-IN')}/yr`
  }
  return 'See listing for details'
}

/**
 * Best-effort guess at whether a real listing reads more like a short,
 * project-based externship than a standard internship — real job boards
 * don't have a formal "externship" tag, so this is a heuristic based on
 * common wording, not a guarantee.
 */
export function guessOpportunityType(job: AdzunaJob): 'internship' | 'externship' {
  const text = `${job.title} ${job.description}`.toLowerCase()
  const externshipHints = ['externship', 'short-term project', 'project-based', 'trainee program', 'certificate program']
  return externshipHints.some((hint) => text.includes(hint)) ? 'externship' : 'internship'
}
