import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@/types'
import axios from 'axios'

interface AuthContextType {
  user: User | null
  token: string | null
  refreshToken: string | null
  register: (username: string, email: string, password: string) => Promise<{
    status: 'authenticated' | 'pending' | 'verification_required'
    message?: string
    verificationId?: string
    expiresAt?: string
  }>
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL
// Allow API cookies when needed
axios.defaults.withCredentials = true
// Ensure Authorization header is attached for every request using latest token
let axiosInterceptorsConfigured = (globalThis as any).__JIANPMS_AXIOS_INTERCEPTOR__ || false
if (!axiosInterceptorsConfigured) {
  axios.interceptors.request.use((config) => {
    const t = localStorage.getItem('token')
    if (t) {
      if (!config.headers) {
        config.headers = {} as any
      }
      if (!('Authorization' in config.headers)) {
        ; (config.headers as any)['Authorization'] = `Bearer ${t}`
      }
    }
    return config
  })
    ; (globalThis as any).__JIANPMS_AXIOS_INTERCEPTOR__ = true
}

let refreshPromise: Promise<string | null> | null = null

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token')
  })
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    return localStorage.getItem('refreshToken')
  })
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setRefreshToken(null)
    delete axios.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }, [])

  // Set authorization header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('token', token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    } else {
      localStorage.removeItem('refreshToken')
    }
  }, [refreshToken])

  // Attempt to refresh access token using stored refresh token
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) {
      return null
    }

    if (!refreshPromise) {
      const currentRefreshToken = refreshToken
      refreshPromise = (async () => {
        try {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken: currentRefreshToken,
          })

          const tokensPayload = response.data?.tokens || response.data?.data?.tokens
          const newAccessToken =
            tokensPayload?.accessToken ?? response.data?.accessToken ?? response.data?.access_token
          const newRefreshToken =
            tokensPayload?.refreshToken ?? response.data?.refreshToken ?? response.data?.refresh_token

          if (!newAccessToken || !newRefreshToken) {
            throw new Error('Malformed refresh response')
          }

          setToken(newAccessToken)
          setRefreshToken(newRefreshToken)
          axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`

          return newAccessToken
        } catch (error) {
          console.error('Token refresh failed:', error)
          logout()
          return null
        } finally {
          refreshPromise = null
        }
      })()
    }

    return refreshPromise
  }, [refreshToken, logout, setToken, setRefreshToken])

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        try {
          console.log('Checking auth with token:', storedToken.substring(0, 20) + '...')
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          })
          console.log('Auth response:', response.data)
          // API returns: { success: true, data: { id, username, ... } }
          if (response.data && response.data.success && response.data.data && response.data.data.id) {
            console.log('Setting user:', response.data.data)
            setUser(response.data.data)
            // Make sure token is set in state as well
            setToken(storedToken)
            const storedRefreshToken = localStorage.getItem('refreshToken')
            if (storedRefreshToken) {
              setRefreshToken(storedRefreshToken)
            }
          } else {
            console.log('No valid user data in response, logging out')
            logout()
          }
        } catch (error: any) {
          console.error('Auth check failed:', error.response?.data || error.message)
          logout()
        }
      } else {
        console.log('No stored token found')
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [logout])

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status
        const originalRequest = error?.config || {}
        if (status === 401) {
          const requestUrl: string = originalRequest?.url || ''
          const bypassEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/guest-auth', '/api/auth/refresh']
          const shouldBypass = bypassEndpoints.some((endpoint) => requestUrl.includes(endpoint))

          if (!shouldBypass && !originalRequest._retry) {
            originalRequest._retry = true
            const newToken = await refreshAccessToken()

            if (newToken) {
              originalRequest.headers = {
                ...(originalRequest.headers || {}),
                Authorization: `Bearer ${newToken}`,
              }
              return axios(originalRequest)
            }

            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
              window.location.href = '/login?sessionExpired=1'
            }
          }
        }

        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptorId)
    }
  }, [logout, refreshAccessToken])

  const register: AuthContextType['register'] = async (username, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password,
      })

      const payload = response.data?.data ?? response.data ?? {}
      if (payload.status === 'verification_required') {
        return {
          status: 'verification_required' as const,
          message: payload.message,
          verificationId: payload.verification_id,
          expiresAt: payload.expires_at,
        }
      }

      if (response.data.success !== false && (response.data.user || response.data.data?.user)) {
        const userData = response.data.user || response.data.data.user
        const tokenFromTopLevel = response.data.token
        const tokenFromNested = response.data.data?.token
        const tokensTopLevel = response.data.tokens
        const tokensNested = response.data.data?.tokens
        const accessTokenTop = tokensTopLevel?.accessToken
        const accessTokenNested = tokensNested?.accessToken

        const resolvedToken = tokenFromTopLevel || tokenFromNested || accessTokenTop || accessTokenNested
        const refreshTokenTop =
          tokensTopLevel?.refreshToken || response.data.refreshToken || response.data.refresh_token
        const refreshTokenNested =
          tokensNested?.refreshToken ||
          response.data.data?.refreshToken ||
          response.data.data?.refresh_token
        const resolvedRefreshToken = refreshTokenTop || refreshTokenNested

        if (resolvedToken && resolvedRefreshToken) {
          setUser(userData)
          setToken(resolvedToken)
          setRefreshToken(resolvedRefreshToken)
          return { status: 'authenticated' }
        }

        return {
          status: 'pending',
          message: response.data.message || response.data.data?.message,
        }
      } else {
        throw new Error(response.data.message || response.data.error || 'Registration failed')
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        (typeof error.response?.data?.error === 'string' ? error.response?.data?.error : null) ||
        error.message ||
        'Registration failed'
      throw new Error(errorMessage)
    }
  }

  const login = async (identifier: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await axios.post('/api/auth/login', {
        identifier,
        password,
        remember_me: rememberMe
      })

      if (response.data.success !== false && (response.data.user || response.data.data?.user)) {
        // Handle common response formats from demo and real API
        const userData = response.data.user || response.data.data.user
        const tokenFromTopLevel = response.data.token
        const tokenFromNested = response.data.data?.token
        const tokensTopLevel = response.data.tokens
        const tokensNested = response.data.data?.tokens
        const accessTokenTop = tokensTopLevel?.accessToken
        const accessTokenNested = tokensNested?.accessToken

        const resolvedToken = tokenFromTopLevel || tokenFromNested || accessTokenTop || accessTokenNested
        const refreshTokenTop =
          tokensTopLevel?.refreshToken || response.data.refreshToken || response.data.refresh_token
        const refreshTokenNested =
          tokensNested?.refreshToken ||
          response.data.data?.refreshToken ||
          response.data.data?.refresh_token
        const resolvedRefreshToken = refreshTokenTop || refreshTokenNested

        if (!resolvedToken) {
          throw new Error('Login succeeded but token was not provided by the server')
        }

        if (!resolvedRefreshToken) {
          throw new Error('Login succeeded but refresh token was not provided by the server')
        }

        setUser(userData)
        setToken(resolvedToken)
        setRefreshToken(resolvedRefreshToken)
      } else {
        throw new Error(response.data.message || response.data.error || 'Login failed')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        (typeof error.response?.data?.error === 'string' ? error.response?.data?.error : null) ||
        error.message ||
        'Login failed'
      throw new Error(errorMessage)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
    register,
    login,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Protected Route HOC
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    window.location.href = '/login'
    return null
  }

  return <>{children}</>
}
