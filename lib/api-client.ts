// API Client with JWT auth, error handling, and mock fallback support
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://back.mydomain.com"

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors: string[]
}

interface PaginatedResponse<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  getToken() {
    return this.token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, mockData?: T): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          throw new Error("Session expired. Please login again.")
        }

        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `HTTP Error: ${response.status}`
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      // If API fails and we have mock data, return it (backend-dependent fallback)
      if (mockData !== undefined) {
        console.warn(`[API Fallback] Using mock data for ${endpoint}`)
        return {
          success: true,
          message: "Using mock data (backend-dependent)",
          data: mockData,
          errors: [],
        }
      }

      const message = error instanceof Error ? error.message : "An error occurred"
      toast.error(message)
      throw error
    }
  }

  async get<T>(endpoint: string, mockData?: T): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" }, mockData)
  }

  async post<T>(endpoint: string, data?: unknown, mockData?: T): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      },
      mockData,
    )
  }

  async put<T>(endpoint: string, data?: unknown, mockData?: T): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      },
      mockData,
    )
  }

  async patch<T>(endpoint: string, data?: unknown, mockData?: T): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
      },
      mockData,
    )
  }

  async delete<T>(endpoint: string, mockData?: T): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" }, mockData)
  }

  async uploadFile(endpoint: string, file: File, folder?: string): Promise<ApiResponse<MediaUploadResult>> {
    const formData = new FormData()
    formData.append("file", file)

    const url = folder ? `${endpoint}?folder=${folder}` : endpoint

    const response = await fetch(`${this.baseUrl}${url}`, {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Upload failed")
    }

    return await response.json()
  }
}

// Media upload result type
interface MediaUploadResult {
  id: string
  originalFileName: string
  storedFileName: string
  extension: string
  contentType: string
  sizeInBytes: number
  sizeFormatted: string
  mediaType: string
  storageProvider: string
  path: string
  url: string
  folder: string
  createdDate: string
}

export const apiClient = new ApiClient(API_BASE_URL)
export type { ApiResponse, PaginatedResponse, MediaUploadResult }
