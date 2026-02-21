import { useState, useEffect, useCallback, useRef } from 'react'
import axios, { AxiosError } from 'axios'

const EMPTY_FILTERS: Record<string, any> = {}

interface PaginationParams {
  page: number
  limit: number
  search: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters: Record<string, any>
  noPagination?: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface UsePaginatedApiResponse<T> {
  data: T[]
  pagination: PaginationInfo
  loading: boolean
  error: string | null
  params: PaginationParams
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  setFilters: (filters: Record<string, any>) => void
  refresh: () => void
  toggleNoPagination: () => void
  sortBy?: string
  sortOrder: 'asc' | 'desc'
  filters: Record<string, any>
}

interface UsePaginatedApiOptions {
  initialLimit?: number
  initialSort?: { sortBy: string; sortOrder: 'asc' | 'desc' }
  initialFilters?: Record<string, any>
  autoLoad?: boolean
}

type LegacyConfig = {
  endpoint: string
  defaultSortBy?: string
  defaultSortOrder?: 'asc' | 'desc'
  initialLimit?: number
  initialFilters?: Record<string, any>
  autoLoad?: boolean
}

export function usePaginatedApi<T>(
  apiCall: (params: PaginationParams) => Promise<{ data: T[]; pagination: PaginationInfo }>,
  options?: UsePaginatedApiOptions
): UsePaginatedApiResponse<T> & {
  searchValue: string
  handlePageChange: (page: number) => void
  handleLimitChange: (limit: number) => void
  handleSearch: (search: string) => void
  handleSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  handleFilter: (filters: Record<string, any>) => void
  refetch: () => void
}
export function usePaginatedApi<T>(
  endpointOrConfig: string | LegacyConfig,
  maybeOptions?: Omit<LegacyConfig, 'endpoint'> | UsePaginatedApiOptions
): UsePaginatedApiResponse<T> & {
  searchValue: string
  handlePageChange: (page: number) => void
  handleLimitChange: (limit: number) => void
  handleSearch: (search: string) => void
  handleSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  handleFilter: (filters: Record<string, any>) => void
  refetch: () => void
}
export function usePaginatedApi<T>(
  arg1: any,
  arg2: any = {}
): any {
  let resolvedApiCall: (params: PaginationParams) => Promise<{ data: T[]; pagination: PaginationInfo }>
  let options: UsePaginatedApiOptions = {}

  if (typeof arg1 === 'function') {
    resolvedApiCall = arg1 as (params: PaginationParams) => Promise<{ data: T[]; pagination: PaginationInfo }>
    options = arg2 || {}
  } else if (typeof arg1 === 'string') {
    const endpoint: string = arg1
    const opts = arg2 || {}
    resolvedApiCall = (params) => fetchPaginatedData<T>(endpoint, params)
    
    // Check if using new UsePaginatedApiOptions format or legacy format
    if ('initialSort' in opts || ('defaultSortBy' in opts === false && 'defaultSortOrder' in opts === false)) {
      // New format
      options = opts as UsePaginatedApiOptions
    } else {
      // Legacy format - convert to new format
      const legacy = opts as Omit<LegacyConfig, 'endpoint'>
      options = {
        initialLimit: legacy.initialLimit,
        initialSort: legacy.defaultSortBy
          ? { sortBy: legacy.defaultSortBy, sortOrder: legacy.defaultSortOrder || 'desc' }
          : undefined,
        initialFilters: legacy.initialFilters,
        autoLoad: legacy.autoLoad,
      }
    }
  } else if (typeof arg1 === 'object' && arg1 && 'endpoint' in arg1) {
    const cfg = arg1 as LegacyConfig
    resolvedApiCall = (params) => fetchPaginatedData<T>(cfg.endpoint, params)
    options = {
      initialLimit: cfg.initialLimit,
      initialSort: cfg.defaultSortBy
        ? { sortBy: cfg.defaultSortBy, sortOrder: cfg.defaultSortOrder || 'desc' }
        : undefined,
      initialFilters: cfg.initialFilters,
      autoLoad: cfg.autoLoad,
    }
  } else {
    throw new Error('Invalid arguments passed to usePaginatedApi')
  }

  const {
    initialLimit = 5,
    initialSort,
    initialFilters = EMPTY_FILTERS,
    autoLoad = true
  } = options

  const [data, setData] = useState<T[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: initialLimit,
    search: '',
    sortBy: initialSort?.sortBy,
    sortOrder: initialSort?.sortOrder || 'desc',
    filters: initialFilters,
    noPagination: false
  })

  const lastParamsKeyRef = useRef<string | null>(null)
  const loadingRef = useRef(false)
  const buildKey = (p: PaginationParams) => JSON.stringify(p)

  const loadData = useCallback(async (customParams?: Partial<PaginationParams>) => {
    const currentParams = { ...params, ...customParams }
    const key = buildKey(currentParams)

    if (lastParamsKeyRef.current === key && loadingRef.current) {
      return
    }

    lastParamsKeyRef.current = key
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const response = await resolvedApiCall(currentParams)
      setData(response.data)
      setPagination(response.pagination)
      setError(null) // Clear any previous errors on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error loading paginated data:', err)
      
      // Provide fallback empty data and reset pagination
      setData([])
      setPagination({
        page: 1,
        limit: currentParams.limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      })
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [resolvedApiCall, params])

  // Auto-load on mount and when params change (single source of truth)
  useEffect(() => {
    if (autoLoad) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, params])

  const setPage = useCallback((page: number) => {
    setParams((previous) => ({ ...previous, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setParams((previous) => ({ ...previous, limit, page: 1 }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setParams((previous) => ({ ...previous, search, page: 1 }))
  }, [])

  const setSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setParams((previous) => ({ ...previous, sortBy, sortOrder }))
  }, [])

  const setFilters = useCallback((filters: Record<string, any>) => {
    setParams((previous) => ({ ...previous, filters, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    loadData()
  }, [loadData])

  const toggleNoPagination = useCallback(() => {
    setParams((previous) => ({ ...previous, noPagination: !previous.noPagination, page: 1 }))
  }, [])

  return {
    data,
    pagination,
    loading,
    error,
    params,
    setPage,
    setLimit,
    setSearch,
    setSort,
    setFilters,
    refresh,
    toggleNoPagination,
    searchValue: params.search,
    handlePageChange: setPage,
    handleLimitChange: setLimit,
    handleSearch: setSearch,
    handleSort: setSort,
    handleFilter: setFilters,
    refetch: refresh,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder || 'desc',
    filters: params.filters,
  }
}

// Helper function to build query string from pagination params
export function buildQueryString(params: PaginationParams): string {
  const searchParams = new URLSearchParams()

  if (!params.noPagination) {
    searchParams.append('page', params.page.toString())
    searchParams.append('limit', params.limit.toString())
  } else {
    searchParams.append('noPagination', 'true')
  }

  if (params.search) {
    searchParams.append('search', params.search)
  }

  if (params.sortBy) {
    searchParams.append('sortBy', params.sortBy)
    searchParams.append('sortOrder', params.sortOrder || 'desc')
  }

  // Add filters
  Object.entries(params.filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString())
    }
  })

  return searchParams.toString()
}

// API client wrapper for making paginated requests
export async function fetchPaginatedData<T>(
  endpoint: string,
  params: PaginationParams,
  options: RequestInit = {}
): Promise<{ data: T[]; pagination: PaginationInfo }> {
  const queryString = buildQueryString(params)
  const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'
  const isAbsolute = /^https?:\/\//i.test(endpoint)
  const base = isAbsolute ? '' : apiBase.replace(/\/$/, '')
  const path = isAbsolute ? endpoint : `${base}${endpoint}`
  const url = queryString ? `${path}?${queryString}` : path

  const normalizeHeaders = (headersInit?: HeadersInit): Record<string, string> => {
    if (!headersInit) {
      return {}
    }

    if (headersInit instanceof Headers) {
      return Object.fromEntries(headersInit.entries())
    }

    if (Array.isArray(headersInit)) {
      return Object.fromEntries(headersInit)
    }

    return { ...headersInit }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...normalizeHeaders(options.headers),
  }
  
  // Add bearer token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const abortSignal = options.signal ?? undefined

  try {
    const response = await axios.request({
      method: 'GET',
      url,
      headers,
      signal: abortSignal,
      withCredentials: true,
    })

    const result = response.data

    // If API returns explicit success flag and it's false, surface server error
    if (typeof result?.success === 'boolean' && result.success === false) {
      throw new Error(result.error || result.message || 'Request failed')
    }

    // Determine the array payload from common shapes
    let payload: any[] = []
    if (Array.isArray(result?.data)) {
      payload = result.data
    } else {
      // Find first array field that isn't pagination/success/message/error
      const arrayEntry = Object.entries(result || {}).find(([key, val]) =>
        key !== 'pagination' && key !== 'success' && key !== 'message' && key !== 'error' && Array.isArray(val)
      )
      if (arrayEntry) {
        payload = arrayEntry[1] as any[]
      }
    }

    // Build pagination with sensible defaults
    const p = result?.pagination || {}
    const page = typeof p.page === 'number' ? p.page : (params.page ?? 1)
    const limit = typeof p.limit === 'number' ? p.limit : (params.limit ?? 20)
    const total = typeof p.total === 'number' ? p.total : (Array.isArray(payload) ? payload.length : 0)
    const totalPages = typeof p.totalPages === 'number' ? p.totalPages : Math.max(1, Math.ceil(total / (limit || 1)))
    const hasPreviousPage = typeof p.hasPreviousPage === 'boolean' ? p.hasPreviousPage : page > 1
    const hasNextPage = typeof p.hasNextPage === 'boolean' ? p.hasNextPage : page < totalPages

    return {
      data: (payload as T[]) || [],
      pagination: { page, limit, total, totalPages, hasNextPage, hasPreviousPage }
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>
      const status = axiosError.response?.status
      
      // Handle 404 - endpoint not found, return empty data instead of throwing
      if (status === 404) {
        console.warn(`API endpoint not found: ${endpoint}. Returning empty data.`)
        return {
          data: [] as T[],
          pagination: {
            page: params.page ?? 1,
            limit: params.limit ?? 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        }
      }
      
      const statusText = axiosError.response?.statusText || 'Request failed'
      const serverMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || ''
      throw new Error(`${statusText}${status ? ` (${status})` : ''}${serverMessage ? ` - ${serverMessage}` : ''}`)
    }

    throw error instanceof Error ? error : new Error('An error occurred')
  }
}

export default usePaginatedApi
