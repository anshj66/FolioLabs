export const ADMIN_EMAIL = "anshj6627@gmail.com"

export function isAdminEmail(email?: string | null) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL
}