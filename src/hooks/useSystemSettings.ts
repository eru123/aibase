import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface SystemSettings {
  enable_ip_check: boolean
  auto_approve_invited_users: boolean
  require_email_verifications: boolean
  allow_registration: boolean
  allow_mail_sending: boolean
  debug_enabled: boolean
  show_ui_components: boolean
  company_name: string
  company_logo_url: string
  company_email: string
  company_phone: string
  company_website: string
  company_address: string
}

const DEFAULT_SETTINGS: SystemSettings = {
  enable_ip_check: true,
  auto_approve_invited_users: false,
  require_email_verifications: false,
  allow_registration: false,
  allow_mail_sending: false,
  debug_enabled: false,
  show_ui_components: false,
  company_name: 'Billing',
  company_logo_url: '',
  company_email: '',
  company_phone: '',
  company_website: '',
  company_address: '',
}

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === '') return fallback
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off'].includes(normalized)) return false
  }
  return fallback
}

const toString = (value: unknown, fallback: string): string => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  return String(value)
}

const fetchSystemSettings = async (isAdmin: boolean): Promise<SystemSettings> => {
  try {
    const endpoint = isAdmin ? '/api/system-settings/security' : '/api/system-settings/public'
    const response = await axios.get(endpoint)
    const data = response.data?.data ?? response.data ?? {}

    return {
      enable_ip_check: toBoolean(
        data.enable_ip_check,
        DEFAULT_SETTINGS.enable_ip_check
      ),
      auto_approve_invited_users: toBoolean(
        data.auto_approve_invited_users,
        DEFAULT_SETTINGS.auto_approve_invited_users
      ),
      require_email_verifications: toBoolean(
        data.require_email_verifications,
        DEFAULT_SETTINGS.require_email_verifications
      ),
      allow_registration: toBoolean(
        data.allow_registration,
        DEFAULT_SETTINGS.allow_registration
      ),
      allow_mail_sending: toBoolean(
        data.allow_mail_sending,
        DEFAULT_SETTINGS.allow_mail_sending
      ),
      debug_enabled: toBoolean(
        data.debug_enabled,
        DEFAULT_SETTINGS.debug_enabled
      ),
      show_ui_components: toBoolean(
        data.show_ui_components,
        DEFAULT_SETTINGS.show_ui_components
      ),
      company_name: toString(
        data.company_name,
        DEFAULT_SETTINGS.company_name
      ),
      company_logo_url: toString(
        data.company_logo_url,
        DEFAULT_SETTINGS.company_logo_url
      ),
      company_email: toString(
        data.company_email,
        DEFAULT_SETTINGS.company_email
      ),
      company_phone: toString(
        data.company_phone,
        DEFAULT_SETTINGS.company_phone
      ),
      company_website: toString(
        data.company_website,
        DEFAULT_SETTINGS.company_website
      ),
      company_address: toString(
        data.company_address,
        DEFAULT_SETTINGS.company_address
      ),
    }
  } catch (error) {
    console.error('Failed to load system settings:', error)
    return { ...DEFAULT_SETTINGS }
  }
}

// We just import useAuth via current module scope since standard hooks can't be conditional?
// Actually we need to import useAuth inside the component or pass it.
// Since useSysSettings is a hook, we can use useAuth inside it.
import { useAuth } from '@/lib/auth'

export const useSystemSettings = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return useQuery({
    queryKey: ['systemSettings', isAdmin],
    queryFn: () => fetchSystemSettings(isAdmin),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
