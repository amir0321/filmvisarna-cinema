import type { ApiResponse } from '../types'

const API_BASE_URL = '/api'
export const AUTH_UNAUTHORIZED_EVENT = 'fv:auth-unauthorized'
let sessionRevision = 0
export function advanceSessionRevision() { sessionRevision += 1 }

export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>
  body?: unknown
  ignoreUnauthorized?: boolean
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { params, headers: customHeaders, body, ignoreUnauthorized, ...restConfig } = config
  const revision = sessionRevision

  // Build full URL with query parameters if provided
  let url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const headers = new Headers(customHeaders)

  if (!['GET', 'HEAD', 'OPTIONS'].includes(restConfig.method ?? 'GET')) {
    headers.set('X-CSRF-Protection', '1')
  }

  // Set default JSON Content-Type unless payload is FormData
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let finalBody: BodyInit | null | undefined
  if (body !== undefined && body !== null) {
    if (isFormData || typeof body === 'string' || body instanceof Blob) {
      finalBody = body as BodyInit
    } else {
      finalBody = JSON.stringify(body)
    }
  }

  const response = await fetch(url, {
    ...restConfig,
    credentials: restConfig.credentials ?? 'same-origin',
    headers,
    body: finalBody,
  })

  // Ignore late failures from requests made with an older session.
  const requestUrl = new URL(url, window.location.origin)
  const path = requestUrl.pathname.replace(/\/$/, '')
  if (!ignoreUnauthorized && !restConfig.signal?.aborted && response.status === 401 && sessionRevision === revision &&
      restConfig.credentials !== 'omit' &&
      requestUrl.origin === window.location.origin &&
      !['/api/auth/login', '/api/auth/change-password'].includes(path)) {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T
  }

  // Parse JSON response or handle text
  let responseData: unknown
  const contentType = response.headers.get('content-type')

  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json()
    } catch {
      responseData = null
    }
  } else {
    try {
      responseData = await response.text()
    } catch {
      responseData = null
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP-fel ${response.status}: ${response.statusText}`
    if (responseData && typeof responseData === 'object') {
      const errorObj = responseData as Record<string, unknown>
      if (typeof errorObj.error === 'string') {
        errorMessage = errorObj.error
      } else if (typeof errorObj.message === 'string') {
        errorMessage = errorObj.message
      }
    } else if (typeof responseData === 'string' && responseData.trim()) {
      errorMessage = responseData
    }

    throw new ApiError(response.status, errorMessage, responseData)
  }

  // If backend returns standard ApiResponse<T>, unwrap data when present
  if (
    responseData &&
    typeof responseData === 'object' &&
    'success' in responseData &&
    'data' in responseData
  ) {
    const apiResponse = responseData as ApiResponse<T>
    return (apiResponse.data !== undefined ? apiResponse.data : null) as T
  }

  return responseData as T
}

export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'body'>) =>
    request<T>(endpoint, { ...config, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'body'>) =>
    request<T>(endpoint, { ...config, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'body'>) =>
    request<T>(endpoint, { ...config, method: 'PATCH', body }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),
}

export default apiClient
