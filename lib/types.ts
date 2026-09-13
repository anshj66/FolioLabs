// Core FolioLabs domain types for learning evidence and assessment

export interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'faculty' | 'mentor'
  avatar?: string
  bio?: string
  institution?: string
  authenticityScore?: number
}

export interface Project {
  id: string
  name: string
  description: string
  category: 'research' | 'maker' | 'entrepreneurial' | 'community'
  startDate: string
  endDate?: string
  status: 'planning' | 'active' | 'completed' | 'paused'
  owner: string // userId
  collaborators: string[] // userIds
  progress: number // 0-100
  tags: string[]
}

export interface Evidence {
  id: string
  projectId: string
  type: 'reflection' | 'artifact' | 'assessment' | 'peer-feedback' | 'milestone'
  title: string
  description: string
  content: string // markdown or rich text
  attachments: string[] // urls or file keys
  createdAt: string
  createdBy: string // userId
  verified: boolean
  verifiedBy?: string // userId
}

export interface Defense {
  id: string
  projectId: string
  title: string
  description: string
  scheduledAt: string
  status: 'scheduled' | 'in-progress' | 'completed'
  defenseType: 'practical' | 'presentation' | 'portfolio-review'
  examiner?: User
  questions?: DefenseQuestion[]
  score?: number
  feedback?: string
}

export interface DefenseQuestion {
  id: string
  question: string
  category: 'conceptual' | 'practical' | 'process' | 'impact'
  evidenceTriggerId?: string // links to specific evidence
  answer?: string
  score?: number
}

export interface FacultyReview {
  id: string
  projectId: string
  reviewer: User
  rating: number // 1-5
  feedback: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  timestamp: string
}

export interface PortfolioEntry {
  id: string
  userId: string
  projectId: string
  title: string
  description: string
  impact: string
  skills: string[]
  evidence: Evidence[]
  verification: FacultyReview[]
  publicUrl: string
  pinned: boolean
}

export interface LabExperiment {
  id: string
  projectId: string
  title: string
  hypothesis: string
  methodology: string
  results: string
  reasoning: string // student's interpretation
  timestamp: string
  matrixData?: MatrixData
  status: 'draft' | 'recorded' | 'analyzed' | 'peer-reviewed'
}

export interface MatrixData {
  rows: number
  cols: number
  values: number[][]
  eigenvalues?: number[]
  eigenvectors?: number[][]
}

export interface Stats {
  activeProjects: number
  completedProjects: number
  authenticityScore: number
  defensesScheduled: number
  evidenceCount: number
  portfolioItems: number
  collaborators: number
}

export type EvidenceEventType = 'experiment' | 'parameter_change' | 'reflection' | 'ai_interaction' | 'feedback' | 'assessment' | 'submission' | 'revision' | 'defense' | 'faculty_validation'

export interface EvidenceEvent {
  id: string
  projectId: string
  type: EvidenceEventType
  title: string
  description: string
  createdAt: string
  verified: boolean
  metadata?: Record<string, string | number>
}

export interface Reflection {
  id: string
  projectId: string
  prompt: string
  response: string
  createdAt: string
}

export interface AssessmentAttempt {
  id: string
  projectId: string
  score: number
  total: number
  completedAt: string
}

export interface ResearchOpportunity {
  id: string
  projectId: string
  title: string
  description: string
  faculty: string
  status: 'potential' | 'active' | 'published'
}

export interface Notification {
  id: string
  title: string
  description: string
  type: 'feedback' | 'milestone' | 'defense' | 'research' | 'verification'
  read: boolean
  createdAt: string
}

export interface Competency {
  id: string
  name: string
  score: number
  evidenceCount: number
  verified: boolean
}

export interface TimelineEvent {
  id: string
  projectId: string
  type: 'milestone' | 'evidence' | 'review' | 'defense'
  title: string
  description: string
  date: string
  icon: 'check' | 'doc' | 'star' | 'shield'
  verified: boolean
}
