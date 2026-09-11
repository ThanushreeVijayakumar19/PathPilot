export const student = {
  name: 'Aditya Sharma',
  initials: 'AS',
  role: 'Computer Science • Junior',
  university: 'National Institute of Technology',
  graduation: 'Class of 2027',
  location: 'Bengaluru, India',
  email: 'aditya.sharma@nit.edu',
  resumeScore: 82,
  skillMatch: 88,
  profileStrength: 76,
  applications: 12,
}

export const skills = [
  { name: 'React', level: 90 },
  { name: 'TypeScript', level: 82 },
  { name: 'Python', level: 78 },
  { name: 'Node.js', level: 74 },
  { name: 'SQL', level: 70 },
  { name: 'Machine Learning', level: 58 },
  { name: 'AWS', level: 45 },
  { name: 'Docker', level: 40 },
]

export const skillGaps = [
  {
    skill: 'System Design',
    importance: 'High',
    reason: 'Required by 8 of your top 10 matched roles.',
  },
  {
    skill: 'AWS / Cloud',
    importance: 'High',
    reason: 'Cloud fundamentals appear in most backend internships.',
  },
  {
    skill: 'Data Structures & Algorithms',
    importance: 'Medium',
    reason: 'Strengthen for technical interview rounds.',
  },
  {
    skill: 'Docker & CI/CD',
    importance: 'Medium',
    reason: 'DevOps exposure boosts full-stack matches.',
  },
]

export const certifications = [
  { name: 'Meta Front-End Developer', issuer: 'Coursera', year: '2025' },
  { name: 'AWS Cloud Practitioner', issuer: 'Amazon', year: '2024' },
  { name: 'Google Data Analytics', issuer: 'Google', year: '2024' },
]

export const projects = [
  {
    name: 'CampusConnect',
    description: 'A social platform for university clubs built with Next.js and Postgres.',
    tags: ['Next.js', 'PostgreSQL', 'Tailwind'],
  },
  {
    name: 'LeafScan AI',
    description: 'A CNN model that detects plant diseases from leaf images.',
    tags: ['Python', 'TensorFlow', 'OpenCV'],
  },
  {
    name: 'FinTrack',
    description: 'A personal finance dashboard with budgeting insights.',
    tags: ['React', 'Node.js', 'Chart.js'],
  },
]

export const aiSuggestions = [
  'Quantify impact on projects — add metrics like "reduced load time by 40%".',
  'Add a "System Design" bullet by describing your architecture decisions in CampusConnect.',
  'Move certifications above extracurriculars to surface credentials faster.',
  'Include a concise 2-line professional summary tuned for software internships.',
]

export type Recommendation = {
  id: string
  company: string
  logoColor: string
  role: string
  match: number
  location: string
  mode: string
  duration: string
  stipend: string
  skills: string[]
  posted: string
}

export const recommendations: Recommendation[] = [
  {
    id: '1',
    company: 'Vercel',
    logoColor: 'oklch(0.2 0 0)',
    role: 'Frontend Engineering Intern',
    match: 94,
    location: 'Remote',
    mode: 'Remote',
    duration: '6 months',
    stipend: '$4,500 / mo',
    skills: ['React', 'TypeScript', 'Next.js'],
    posted: '2 days ago',
  },
  {
    id: '2',
    company: 'Stripe',
    logoColor: 'oklch(0.54 0.22 264)',
    role: 'Full-Stack Developer Intern',
    match: 91,
    location: 'Bengaluru, IN',
    mode: 'Hybrid',
    duration: '5 months',
    stipend: '₹85,000 / mo',
    skills: ['Node.js', 'React', 'SQL'],
    posted: '4 days ago',
  },
  {
    id: '3',
    company: 'Notion',
    logoColor: 'oklch(0.3 0 0)',
    role: 'Product Engineering Extern',
    match: 88,
    location: 'Remote',
    mode: 'Remote',
    duration: '3 months',
    stipend: '$3,800 / mo',
    skills: ['TypeScript', 'React', 'GraphQL'],
    posted: '1 week ago',
  },
  {
    id: '4',
    company: 'Zomato',
    logoColor: 'oklch(0.6 0.2 25)',
    role: 'Backend Engineering Intern',
    match: 85,
    location: 'Gurugram, IN',
    mode: 'On-site',
    duration: '6 months',
    stipend: '₹70,000 / mo',
    skills: ['Python', 'SQL', 'AWS'],
    posted: '3 days ago',
  },
  {
    id: '5',
    company: 'Figma',
    logoColor: 'oklch(0.55 0.23 305)',
    role: 'ML Research Intern',
    match: 79,
    location: 'Remote',
    mode: 'Remote',
    duration: '4 months',
    stipend: '$4,200 / mo',
    skills: ['Python', 'ML', 'PyTorch'],
    posted: '5 days ago',
  },
  {
    id: '6',
    company: 'Razorpay',
    logoColor: 'oklch(0.54 0.2 250)',
    role: 'Data Engineering Intern',
    match: 76,
    location: 'Bengaluru, IN',
    mode: 'Hybrid',
    duration: '6 months',
    stipend: '₹60,000 / mo',
    skills: ['SQL', 'Python', 'Docker'],
    posted: '1 week ago',
  },
]

export type RoadmapStage = {
  phase: string
  title: string
  status: 'done' | 'active' | 'upcoming'
  items: { type: 'skill' | 'course' | 'project' | 'cert'; label: string }[]
}

export const roadmap: RoadmapStage[] = [
  {
    phase: 'Phase 1',
    title: 'Strengthen Core Foundations',
    status: 'done',
    items: [
      { type: 'skill', label: 'Advanced React patterns' },
      { type: 'course', label: 'The Joy of React — Josh Comeau' },
      { type: 'project', label: 'Built CampusConnect' },
      { type: 'cert', label: 'Meta Front-End Developer' },
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Backend & Databases',
    status: 'active',
    items: [
      { type: 'skill', label: 'Node.js + REST APIs' },
      { type: 'course', label: 'Database Design Fundamentals' },
      { type: 'project', label: 'Build a scalable REST API' },
      { type: 'cert', label: 'PostgreSQL Associate' },
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Cloud & System Design',
    status: 'upcoming',
    items: [
      { type: 'skill', label: 'AWS core services' },
      { type: 'course', label: 'Grokking System Design' },
      { type: 'project', label: 'Deploy a microservice on AWS' },
      { type: 'cert', label: 'AWS Solutions Architect' },
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Interview Readiness',
    status: 'upcoming',
    items: [
      { type: 'skill', label: 'DSA mastery' },
      { type: 'course', label: 'NeetCode 150' },
      { type: 'project', label: 'Mock interview sprint' },
      { type: 'cert', label: 'Land the internship' },
    ],
  },
]

export const notifications = [
  { title: 'New match: Vercel Frontend Intern', detail: '94% match • 2 days ago', unread: true },
  { title: 'AIRA finished analyzing your resume', detail: 'Score improved to 82', unread: true },
  { title: 'Application viewed by Stripe', detail: 'Your application was opened', unread: false },
]

// Lightweight, deterministic AIRA reply engine (no external API needed for the demo).
export function airaReply(message: string): string {
  const q = message.toLowerCase()

  if (/resume|cv/.test(q)) {
    return "Your resume currently scores 82/100 — strong! To push past 90, quantify your project impact (e.g. \"cut API latency by 35%\"), add a 2-line summary tuned for software internships, and surface your certifications higher up. Want me to draft an improved summary section for you?"
  }
  if (/skill|learn|improve|gap/.test(q)) {
    return 'Based on your matched roles, your biggest leverage skills right now are System Design and AWS/Cloud fundamentals. I\u2019d start with "Grokking System Design" and the AWS Cloud Practitioner path. Mastering these could lift your average match score from 88% toward the mid-90s.'
  }
  if (/internship|job|role|recommend|apply/.test(q)) {
    return 'Your top match today is the Frontend Engineering Intern role at Vercel at 94% \u2014 it lines up perfectly with your React, TypeScript and Next.js strengths. Stripe (91%) and Notion (88%) are excellent backups. Tailor your resume\u2019s top bullet to each role and you\u2019ll stand out. Want tips for the Vercel application?'
  }
  if (/roadmap|plan|path|career/.test(q)) {
    return 'You\u2019re in Phase 2 of your roadmap: Backend & Databases. Finish your scalable REST API project and the PostgreSQL cert, then move into Cloud & System Design in Phase 3. Staying on this path keeps you interview-ready well before recruiting season.'
  }
  if (/interview|prepare/.test(q)) {
    return 'For interviews, focus on three tracks: (1) DSA \u2014 grind NeetCode 150, (2) System Design \u2014 practice designing scalable systems out loud, and (3) behavioral \u2014 prepare STAR stories from CampusConnect and LeafScan AI. I can generate mock questions whenever you\u2019re ready.'
  }
  if (/hello|hi|hey|start/.test(q)) {
    return "Hi Aditya! I\u2019m AIRA, your career copilot. I can review your resume, recommend internships, plan your learning roadmap, or prep you for interviews. What would you like to focus on today?"
  }
  return "Great question! Here\u2019s my take: keep building on your React and full-stack strengths while closing your System Design and cloud gaps \u2014 that combination is exactly what your top matched internships are looking for. Ask me anything about your resume, skills, recommendations, or roadmap and I\u2019ll guide you."
}

export const airaSuggestedPrompts = [
  'How can I improve my resume?',
  'Which internship should I apply to first?',
  'What skills should I learn next?',
  'Help me prepare for interviews',
]
