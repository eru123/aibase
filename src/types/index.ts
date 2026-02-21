export type Role = 'admin' | 'support' | 'client'

export interface User {
  id: number | string
  username: string
  firstName?: string
  lastName?: string
  display_name?: string | null
  email: string
  avatar_url?: string | null
  role: Role
  is_active?: boolean
  isActive?: boolean
  is_approved?: boolean
  is_rejected?: boolean
  approved_at?: string | null
  approved_by?: number | null
  email_verified_at?: string | null
  mfa_enabled?: boolean
  mfa_method?: 'email' | 'authenticator' | null
  timezone?: string
  currency?: string
  preferences?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface InvitationSummary {
  email: string
  role: Role
  expires_at: string
}
