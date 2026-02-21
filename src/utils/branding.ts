/**
 * Branding Configuration for Web App
 * Centralizes all branding-related environment variables
 */

export const brandingConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'Billing Portal',
  appShortName: import.meta.env.VITE_APP_SHORT_NAME || 'Billing',
  companyName: import.meta.env.VITE_COMPANY_NAME || 'Billing',
  hotelBrandName: import.meta.env.VITE_HOTEL_BRAND_NAME || 'Billing',
} as const

export type BrandingConfig = typeof brandingConfig
