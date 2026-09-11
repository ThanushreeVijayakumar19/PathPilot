import { CAREER_SKILL_TAXONOMY } from '@/lib/career-skills'

// Build a broad, deduplicated skill vocabulary from the career taxonomy plus
// common extras that show up in real job postings but aren't role-specific.
const EXTRA_SKILLS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'PHP',
  'Ruby',
  'Go',
  'Swift',
  'Kotlin',
  'React',
  'Angular',
  'Vue',
  'Node.js',
  'Express',
  'Django',
  'Flask',
  'Spring Boot',
  'HTML',
  'CSS',
  'Tailwind CSS',
  'Bootstrap',
  'SQL',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'AWS',
  'Azure',
  'Google Cloud',
  'Docker',
  'Kubernetes',
  'Git',
  'CI/CD',
  'Linux',
  'REST APIs',
  'GraphQL',
  'Machine Learning',
  'Deep Learning',
  'TensorFlow',
  'PyTorch',
  'Scikit-learn',
  'Pandas',
  'NumPy',
  'Data Analysis',
  'Data Visualization',
  'Power BI',
  'Tableau',
  'Excel',
  'Figma',
  'Adobe XD',
  'Photoshop',
  'Illustrator',
  'UI Design',
  'UX Research',
  'SEO',
  'Content Writing',
  'Social Media Marketing',
  'Google Analytics',
  'Communication',
  'Project Management',
  'Agile',
  'Scrum',
  'Problem Solving',
  'Leadership',
  'Video Editing',
  'C (Programming)',
  'Selenium',
  'Testing',
  'Jest',
  'Networking',
  'Cybersecurity',
  'Cryptography',
  'Salesforce',
  'SAP',
  'Wireshark',
  'Nmap',
]

export const SKILL_VOCABULARY: string[] = Array.from(
  new Set([
    ...Object.values(CAREER_SKILL_TAXONOMY).flatMap((skills) =>
      skills.map((s) => s.skill),
    ),
    ...EXTRA_SKILLS,
  ]),
)

/**
 * Deterministically extracts known skills mentioned in a piece of text
 * (e.g. a real job posting's title + description) by scanning against a
 * curated vocabulary — no AI call needed. Word-boundary aware so "Go"
 * doesn't match inside "Google", etc.
 */
export function extractSkillsFromText(text: string, limit = 8): string[] {
  const found: string[] = []
  const lower = text.toLowerCase()

  for (const skill of SKILL_VOCABULARY) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(?<![a-z0-9])${escaped.toLowerCase()}(?![a-z0-9])`, 'i')
    if (pattern.test(lower)) {
      found.push(skill)
    }
    if (found.length >= limit) break
  }

  return found
}
