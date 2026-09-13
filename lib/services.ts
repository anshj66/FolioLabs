// Service abstraction layer for FolioLabs data and operations
// These can later map to MongoDB, S3, Lambda, and LLM services

import type {
  User,
  Project,
  Evidence,
  Defense,
  LabExperiment,
  FacultyReview,
  PortfolioEntry,
} from './types'
import {
  demoUser,
  demoProjects,
  demoEvidence,
  demoLabExperiments,
  demoReviews,
  demoTimeline,
  demoStats,
} from './demo-data'

// User Service
export const userService = {
  getCurrentUser: async (): Promise<User> => {
    // TODO: Replace with auth + MongoDB query
    return demoUser
  },

  getUserById: async (id: string): Promise<User | null> => {
    // TODO: Replace with MongoDB query
    return demoUser
  },
}

// Project Service
export const projectService = {
  getProjects: async (userId: string): Promise<Project[]> => {
    // TODO: Replace with MongoDB query filtered by userId
    return demoProjects
  },

  getProjectById: async (id: string): Promise<Project | null> => {
    // TODO: Replace with MongoDB query
    return demoProjects.find((p) => p.id === id) || null
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    // TODO: Replace with MongoDB insert
    console.log('[v0] Creating project:', data)
    return { ...demoProjects[0], ...data } as Project
  },
}

// Evidence Service
export const evidenceService = {
  getEvidenceByProject: async (projectId: string): Promise<Evidence[]> => {
    // TODO: Replace with MongoDB query
    return demoEvidence.filter((e) => e.projectId === projectId)
  },

  recordEvidence: async (
    projectId: string,
    data: Partial<Evidence>
  ): Promise<Evidence> => {
    // TODO: Replace with MongoDB insert + S3 upload for attachments
    console.log('[v0] Recording evidence:', projectId, data)
    return {
      ...demoEvidence[0],
      projectId,
      ...data,
      id: `ev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as Evidence
  },

  verifyEvidence: async (evidenceId: string, userId: string): Promise<void> => {
    // TODO: Replace with MongoDB update
    console.log('[v0] Verifying evidence:', evidenceId, 'by', userId)
  },
}

// Lab Service
export const labService = {
  recordExperiment: async (
    projectId: string,
    data: Partial<LabExperiment>
  ): Promise<LabExperiment> => {
    // TODO: Replace with MongoDB insert + potentially Lambda for computation
    console.log('[v0] Recording lab experiment:', projectId, data)
    return {
      ...demoLabExperiments[0],
      projectId,
      ...data,
      id: `lab-${Date.now()}`,
      timestamp: new Date().toISOString(),
    } as LabExperiment
  },

  getExperimentsByProject: async (projectId: string): Promise<LabExperiment[]> => {
    // TODO: Replace with MongoDB query
    return demoLabExperiments.filter((e) => e.projectId === projectId)
  },
}

// Defense Service
export const defenseService = {
  scheduleDefense: async (
    projectId: string,
    data: Partial<Defense>
  ): Promise<Defense> => {
    // TODO: Replace with MongoDB insert + calendar integration
    console.log('[v0] Scheduling defense:', projectId, data)
    return {
      id: `def-${Date.now()}`,
      projectId,
      title: data.title || 'Project Defense',
      description: data.description || '',
      scheduledAt: data.scheduledAt || new Date().toISOString(),
      status: 'scheduled',
      defenseType: data.defenseType || 'presentation',
    } as Defense
  },

  recordDefenseResponse: async (
    defenseId: string,
    questionId: string,
    answer: string
  ): Promise<void> => {
    // TODO: Replace with MongoDB update
    console.log('[v0] Recording defense response:', defenseId, questionId)
  },
}

// Faculty Service
export const facultyService = {
  reviewProject: async (
    projectId: string,
    reviewData: Partial<FacultyReview>
  ): Promise<FacultyReview> => {
    // TODO: Replace with MongoDB insert
    console.log('[v0] Faculty reviewing project:', projectId, reviewData)
    return {
      ...demoReviews[0],
      projectId,
      ...reviewData,
      id: `rev-${Date.now()}`,
      timestamp: new Date().toISOString(),
    } as FacultyReview
  },

  getReviewsByProject: async (projectId: string): Promise<FacultyReview[]> => {
    // TODO: Replace with MongoDB query
    return demoReviews.filter((r) => r.projectId === projectId)
  },
}

// Portfolio Service
export const portfolioService = {
  publishPortfolioEntry: async (
    userId: string,
    entry: Partial<PortfolioEntry>
  ): Promise<PortfolioEntry> => {
    // TODO: Replace with MongoDB insert + generate public URL
    console.log('[v0] Publishing portfolio entry:', userId, entry)
    return {
      id: `port-${Date.now()}`,
      userId,
      projectId: entry.projectId || '',
      title: entry.title || '',
      description: entry.description || '',
      impact: entry.impact || '',
      skills: entry.skills || [],
      evidence: [],
      verification: [],
      publicUrl: `folio.labs/${userId}/${Date.now()}`,
      pinned: false,
    } as PortfolioEntry
  },
}

// Stats Service
export const statsService = {
  getUserStats: async (userId: string) => {
    // TODO: Replace with MongoDB aggregations
    return demoStats
  },
}

// Timeline Service
export const timelineService = {
  getProjectTimeline: async (projectId: string) => {
    // TODO: Replace with MongoDB query
    return demoTimeline.filter((e) => e.projectId === projectId)
  },
}
