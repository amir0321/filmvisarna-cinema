export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ApiErrorDetail {
  status: number
  message: string
  data?: unknown
}
