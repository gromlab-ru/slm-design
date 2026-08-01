import {
  clearSimpleAuthSession,
  getSimpleAuthSession,
  rotateSimpleAuthSession,
  withSimpleAuthRefreshLock
} from '@/infra/simple-auth-session'
import type { SimpleAuthSessionIdentity } from '@/infra/simple-auth-session'

import { SIMPLE_REST_API_BASE_URL, SIMPLE_REST_API_TIMEOUT_MS } from './config/simple-rest-api.config'
import { ApiError, HttpClient } from './generated'
import { simpleAuthRefresh } from './generated/operations/simple-auth-refresh'
import { getDemoScenario } from './request-context'

const refreshPromisesByRevision = new Map<string, Promise<string | null>>()

/**
 * Возвращает revision, уже созданную конкурентным refresh той же session.
 */
const getConcurrentRevision = (expected: SimpleAuthSessionIdentity): string | null => {
  const currentSession = getSimpleAuthSession()

  if (
    currentSession !== null &&
    currentSession.sessionId === expected.sessionId &&
    currentSession.revision !== expected.revision
  ) {
    return currentSession.revision
  }

  return null
}

/**
 * Выполняет CAS-ротацию refresh token через транспорт без retry-цикла.
 */
const performTokenRefresh = async (expected: SimpleAuthSessionIdentity): Promise<string | null> => {
  return withSimpleAuthRefreshLock(async () => {
    const session = getSimpleAuthSession()

    if (session === null || session.sessionId !== expected.sessionId) {
      return null
    }

    if (session.revision !== expected.revision) {
      return session.revision
    }

    const refreshHttpClient = new HttpClient({
      baseUrl: SIMPLE_REST_API_BASE_URL,
      timeout: SIMPLE_REST_API_TIMEOUT_MS,
      onRequest: (params) => {
        const headers = new Headers(params.headers)
        headers.set('X-Demo-Scenario', getDemoScenario())

        return { ...params, headers }
      }
    })

    try {
      const response = await simpleAuthRefresh(refreshHttpClient, {
        refreshToken: session.tokens.refreshToken
      })
      const rotatedSession = await rotateSimpleAuthSession(expected, response.data.tokens)

      return rotatedSession?.revision ?? getConcurrentRevision(expected)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const concurrentRevision = getConcurrentRevision(expected)

        if (concurrentRevision !== null) {
          return concurrentRevision
        }

        await clearSimpleAuthSession(expected)
      }

      throw error
    }
  })
}

/**
 * Дедуплицирует refresh только внутри одной исходной session revision.
 */
export const refreshSimpleAccessToken = (
  expected: SimpleAuthSessionIdentity
): Promise<string | null> => {
  const existingPromise = refreshPromisesByRevision.get(expected.revision)

  if (existingPromise !== undefined) {
    return existingPromise
  }

  const refreshPromise = performTokenRefresh(expected).finally(() => {
    refreshPromisesByRevision.delete(expected.revision)
  })

  refreshPromisesByRevision.set(expected.revision, refreshPromise)

  return refreshPromise
}
