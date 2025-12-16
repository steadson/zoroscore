import axios, { AxiosError, AxiosRequestConfig } from 'axios'

/**
 * API Client configuration
 */
const apiClient = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'ZoroScore/1.0',
  },
})

/**
 * Retry configuration
 */
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network errors are retryable
    return true
  }

  // Retry on 5xx errors and 429 (rate limit)
  const status = error.response.status
  return status >= 500 || status === 429
}

/**
 * Make HTTP GET request with retry logic
 */
export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    const response = await apiClient.get<T>(url, config)
    return response.data
  } catch (error) {
    const axiosError = error as AxiosError

    // If we have retries left and error is retryable
    if (retries > 0 && isRetryableError(axiosError)) {
      console.log(`API request failed, retrying... (${retries} retries left)`)
      await sleep(RETRY_DELAY)
      return apiGet<T>(url, config, retries - 1)
    }

    // Log error details
    console.error('API Request Failed:', {
      url,
      status: axiosError.response?.status,
      message: axiosError.message,
      data: axiosError.response?.data,
    })

    throw new Error(
      `API request failed: ${axiosError.message} (${axiosError.response?.status || 'Network Error'})`
    )
  }
}

/**
 * Make HTTP POST request
 */
export async function apiPost<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, data, config)
    return response.data
  } catch (error) {
    const axiosError = error as AxiosError
    console.error('API POST Failed:', {
      url,
      status: axiosError.response?.status,
      message: axiosError.message,
    })
    throw new Error(`API POST failed: ${axiosError.message}`)
  }
}

/**
 * Validate API response
 */
export function validateResponse<T>(data: T, requiredFields: string[]): boolean {
  if (!data || typeof data !== 'object') {
    return false
  }

  return requiredFields.every((field) => field in (data as any))
}

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || 'API request failed'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unknown error occurred'
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    
    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = this.requests[0]
      const waitTime = this.windowMs - (now - oldestRequest)
      
      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms...`)
        await sleep(waitTime)
      }
    }

    this.requests.push(now)
  }
}

/**
 * Create rate limiter instance
 * Example: 60 requests per minute
 */
export const defaultRateLimiter = new RateLimiter(60, 60000)