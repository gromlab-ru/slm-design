import { ApiError, HttpClient } from '../generated'
import { simpleAuthRefresh } from '../generated/operations/simple-auth-refresh'
import {
  SIMPLE_REST_API_BASE_URL,
  SIMPLE_REST_API_TIMEOUT_MS
} from '../config/simple-rest-api.config'
import {
  clearSimpleRestApiTokens,
  getSimpleRestApiAccessToken,
  getSimpleRestApiRefreshToken,
  setSimpleRestApiTokens
} from '../session/simple-rest-api-credentials'
import { notifySimpleRestApiSessionExpired } from '../session/simple-rest-api-session-events'

const refreshHttpClient = new HttpClient({
  baseUrl: SIMPLE_REST_API_BASE_URL,
  timeout: SIMPLE_REST_API_TIMEOUT_MS
})

let refreshPromise: Promise<void> | null = null

/**
 * Ротирует refresh token и объединяет конкурентные 401 в один запрос.
 */
const refreshSimpleRestApiSession = async (): Promise<void> => {
  const refreshToken = getSimpleRestApiRefreshToken()

  if (!refreshToken) {
    throw new Error('Refresh token is missing')
  }

  if (!refreshPromise) {
    refreshPromise = simpleAuthRefresh(refreshHttpClient, { refreshToken })
      .then((response) => {
        setSimpleRestApiTokens(response.data.tokens)
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

/** Транспортный HTTP-клиент Simple REST API. */
export const simpleHttpClient = new HttpClient({
  baseUrl: SIMPLE_REST_API_BASE_URL,
  timeout: SIMPLE_REST_API_TIMEOUT_MS,
  onRequest: (params) => {
    const token = getSimpleRestApiAccessToken()

    if (!params.secure || !token) {
      return params
    }

    const headers = new Headers(params.headers)

    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return { ...params, headers }
  },
  onError: async (error, context) => {
    const shouldRefresh =
      error instanceof ApiError &&
      error.status === 401 &&
      context.request.secure === true &&
      context.retryCount === 0

    if (!shouldRefresh) {
      throw error
    }

    try {
      await refreshSimpleRestApiSession()
      return context.retry()
    } catch (refreshError) {
      clearSimpleRestApiTokens()
      notifySimpleRestApiSessionExpired()
      throw refreshError
    }
  }
})
