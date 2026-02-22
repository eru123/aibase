/**
 * Branding Configuration for Web App
 * Centralizes all branding-related environment variables
 */

export const brandingConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'AIBase Portal',
  appShortName: import.meta.env.VITE_APP_SHORT_NAME || 'AIBase',
  companyName: import.meta.env.VITE_COMPANY_NAME || 'AIBase',
  hotelBrandName: import.meta.env.VITE_HOTEL_BRAND_NAME || 'AIBase',
} as const

export type BrandingConfig = typeof brandingConfig
