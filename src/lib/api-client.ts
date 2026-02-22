const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Try to get token from cookie
    if (typeof window !== 'undefined') {
      const cookieState = getCookie(ACCESS_TOKEN)
      this.token = cookieState ? JSON.parse(cookieState) : null
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      setCookie(ACCESS_TOKEN, JSON.stringify(token))
    } else {
      removeCookie(ACCESS_TOKEN)
    }
  }

  getToken() {
    return this.token
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }
    return url.toString()
  }

  private async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { params, ...fetchConfig } = config

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(config.headers || {}),
    }

    // Always ensure we have the latest token from cookies before making request
    const cookieState = getCookie(ACCESS_TOKEN)
    const latestToken = cookieState ? JSON.parse(cookieState) : this.token
    
    if (latestToken) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${latestToken}`
    }

    const response = await fetch(this.buildUrl(path, params), {
      ...fetchConfig,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      const message = error.error || error.message || 'Request failed'
      
      // Throw object with status for error handling
      throw { 
        status: response.status, 
        message,
        toString: () => message // Backward compatibility for printing error directly
      }
    }

    return response.json()
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(path, { method: 'GET', params })
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export const api = new ApiClient(API_BASE_URL)
