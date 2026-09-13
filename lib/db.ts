export const db = {
  provider: "mongodb-atlas" as const,
  async find<T>(_collection: string, _query: Record<string, unknown> = {}): Promise<T[]> {
    return []
  },
  async insert<T>(_collection: string, document: T): Promise<T> {
    return document
  },
}

export type DbCollection = "projects" | "evidence" | "reviews" | "assessments" | "defenses" | "notifications"

export const dbCollections: Record<DbCollection, string> = {
  projects: "projects",
  evidence: "evidence",
  reviews: "reviews",
  assessments: "assessments",
  defenses: "defenses",
  notifications: "notifications",
}
