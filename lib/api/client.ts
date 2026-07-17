/**
 * API Client Wrapper
 * Delegates to the authenticated apiClient in lib/api-client.ts
 * These are convenience functions that match the old API
 * 
 * IMPORTANT: Now uses authenticated Firebase tokens for all requests
 */

import { apiClient as authenticatedApiClient, extractApiData } from '@/lib/api-client'

export interface FetchOptions extends RequestInit {
  timeout?: number
}

/**
 * GET request helper - delegates to authenticated client
 */
export async function apiGet<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const response = await authenticatedApiClient.get(endpoint, undefined, {
    timeout: options?.timeout,
  })
  return extractApiData<T>(response)
}

/**
 * POST request helper - delegates to authenticated client
 */
export async function apiPost<T>(
  endpoint: string,
  data?: any,
  options?: FetchOptions
): Promise<T> {
  const response = await authenticatedApiClient.post(endpoint, data, {
    timeout: options?.timeout,
  })
  return extractApiData<T>(response)
}

/**
 * PUT request helper - delegates to authenticated client
 */
export async function apiPut<T>(
  endpoint: string,
  data?: any,
  options?: FetchOptions
): Promise<T> {
  const response = await authenticatedApiClient.patch(endpoint, data, {
    timeout: options?.timeout,
  })
  return extractApiData<T>(response)
}

/**
 * PATCH request helper - delegates to authenticated client
 */
export async function apiPatch<T>(
  endpoint: string,
  data?: any,
  options?: FetchOptions
): Promise<T> {
  const response = await authenticatedApiClient.patch(endpoint, data, {
    timeout: options?.timeout,
  })
  return extractApiData<T>(response)
}

/**
 * DELETE request helper - delegates to authenticated client
 */
export async function apiDelete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const response = await authenticatedApiClient.delete(endpoint, {
    timeout: options?.timeout,
  })
  return extractApiData<T>(response)
}
/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}