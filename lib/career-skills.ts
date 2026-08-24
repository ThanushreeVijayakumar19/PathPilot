export interface TaxonomySkill {
  skill: string
  importance: 'high' | 'medium'
}

/**
 * Curated reference skill sets per career role. This is the "ground truth"
 * used to detect skill gaps deterministically via embedding similarity,
 * instead of asking an LLM to freely invent gaps (which tends to be
 * inconsistent and sometimes generic/off-target).
 */
export const CAREER_SKILL_TAXONOMY: Record<string, TaxonomySkill[]> = {
  'Frontend Developer': [
    { skill: 'HTML', importance: 'high' },
    { skill: 'CSS', importance: 'high' },
    { skill: 'JavaScript', importance: 'high' },
    { skill: 'React', importance: 'high' },
    { skill: 'Git', importance: 'high' },
    { skill: 'TypeScript', importance: 'medium' },
    { skill: 'Responsive Design', importance: 'medium' },
    { skill: 'REST APIs', importance: 'medium' },
    { skill: 'Browser DevTools debugging', importance: 'medium' },
    { skill: 'Web accessibility', importance: 'medium' },
    { skill: 'Testing (Jest/Vitest)', importance: 'medium' },
  ],
  'Backend Developer': [
    { skill: 'A backend language (Node.js/Python/Java)', importance: 'high' },
    { skill: 'REST APIs', importance: 'high' },
    { skill: 'SQL', importance: 'high' },
    { skill: 'Git', importance: 'high' },
    { skill: 'Databases (PostgreSQL/MySQL)', importance: 'high' },
    { skill: 'Authentication & security basics', importance: 'medium' },
    { skill: 'Docker', importance: 'medium' },
    { skill: 'API testing (Postman)', importance: 'medium' },
    { skill: 'System design basics', importance: 'medium' },
  ],
  'Full Stack Developer': [
    { skill: 'HTML', importance: 'high' },
    { skill: 'CSS', importance: 'high' },
    { skill: 'JavaScript', importance: 'high' },
    { skill: 'React', importance: 'high' },
    { skill: 'Node.js', importance: 'high' },
    { skill: 'SQL', importance: 'high' },
    { skill: 'Git', importance: 'high' },
    { skill: 'REST APIs', importance: 'medium' },
    { skill: 'TypeScript', importance: 'medium' },
    { skill: 'Deployment (Vercel/Docker)', importance: 'medium' },
  ],
  'Data Analyst': [
    { skill: 'SQL', importance: 'high' },
    { skill: 'Excel', importance: 'high' },
    { skill: 'Python', importance: 'high' },
    { skill: 'Data Visualization', importance: 'high' },
    { skill: 'Statistics fundamentals', importance: 'medium' },
    { skill: 'Power BI or Tableau', importance: 'medium' },
    { skill: 'Pandas', importance: 'medium' },
    { skill: 'Data cleaning', importance: 'medium' },
  ],
  'Data Scientist / ML Engineer': [
    { skill: 'Python', importance: 'high' },
    { skill: 'Pandas', importance: 'high' },
    { skill: 'NumPy', importance: 'high' },
    { skill: 'Machine Learning fundamentals', importance: 'high' },
    { skill: 'SQL', importance: 'high' },
    { skill: 'Statistics', importance: 'medium' },
    { skill: 'Scikit-learn', importance: 'medium' },
    { skill: 'Data Visualization', importance: 'medium' },
    { skill: 'Deep learning basics', importance: 'medium' },
    { skill: 'Git', importance: 'medium' },
  ],
  'Mobile App Developer': [
    { skill: 'A mobile framework (React Native/Flutter/Swift/Kotlin)', importance: 'high' },
    { skill: 'JavaScript or a native language', importance: 'high' },
    { skill: 'REST APIs', importance: 'high' },
    { skill: 'Git', importance: 'high' },
    { skill: 'UI design principles', importance: 'medium' },
    { skill: 'App state management', importance: 'medium' },
    { skill: 'Publishing to app stores', importance: 'medium' },
  ],
  'UI/UX Designer': [
    { skill: 'Figma', importance: 'high' },
    { skill: 'User Research', importance: 'high' },
    { skill: 'Wireframing', importance: 'high' },
    { skill: 'Prototyping', importance: 'high' },
    { skill: 'Visual design principles', importance: 'medium' },
    { skill: 'Usability testing', importance: 'medium' },
    { skill: 'Design systems', importance: 'medium' },
  ],
  'DevOps / Cloud Engineer': [
    { skill: 'Linux', importance: 'high' },
    { skill: 'Docker', importance: 'high' },
    { skill: 'A cloud platform (AWS/Azure/GCP)', importance: 'high' },
    { skill: 'CI/CD', importance: 'high' },
    { skill: 'Git', importance: 'high' },
    { skill: 'Scripting (Bash/Python)', importance: 'medium' },
    { skill: 'Kubernetes', importance: 'medium' },
    { skill: 'Infrastructure as Code (Terraform)', importance: 'medium' },
    { skill: 'Networking basics', importance: 'medium' },
  ],
  Cybersecurity: [
    { skill: 'Networking fundamentals', importance: 'high' },
    { skill: 'Linux', importance: 'high' },
    { skill: 'Security fundamentals (CIA triad, threats)', importance: 'high' },
    { skill: 'Common vulnerabilities (OWASP Top 10)', importance: 'high' },
    { skill: 'Scripting (Python/Bash)', importance: 'medium' },
    { skill: 'A security tool (Wireshark/Nmap/Burp Suite)', importance: 'medium' },
    { skill: 'Cryptography basics', importance: 'medium' },
  ],
  'Product Management': [
    { skill: 'Product strategy', importance: 'high' },
    { skill: 'User research', importance: 'high' },
    { skill: 'Roadmapping & prioritization', importance: 'high' },
    { skill: 'Data-informed decision making', importance: 'medium' },
    { skill: 'Wireframing/prototyping basics', importance: 'medium' },
    { skill: 'Stakeholder communication', importance: 'medium' },
    { skill: 'Agile/Scrum basics', importance: 'medium' },
  ],
  Other: [
    { skill: 'Communication', importance: 'high' },
    { skill: 'Problem solving', importance: 'high' },
    { skill: 'Git', importance: 'medium' },
    { skill: 'A relevant technical tool for your field', importance: 'medium' },
  ],
}

export function getTaxonomyForRole(role: string): TaxonomySkill[] {
  return CAREER_SKILL_TAXONOMY[role] ?? CAREER_SKILL_TAXONOMY['Other']
}
