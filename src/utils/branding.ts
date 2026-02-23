/**
 * Branding Configuration for Web App
 * Centralizes all branding-related environment variables
 */

export const brandingConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'OpenSys',
  appShortName: import.meta.env.VITE_APP_SHORT_NAME || 'OpenSys',
  companyName: import.meta.env.VITE_COMPANY_NAME || 'OpenSys',
} as const

export type BrandingConfig = typeof brandingConfig
