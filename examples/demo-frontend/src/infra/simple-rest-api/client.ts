import {
  clearSimpleAuthSession,
  getSimpleAuthSession
} from '@/infra/simple-auth-session'
import type { SimpleAuthSessionIdentity } from '@/infra/simple-auth-session'
import { isArray } from '@/shared/lib/value-predicates'

import { SIMPLE_REST_API_BASE_URL, SIMPLE_REST_API_TIMEOUT_MS } from './config/simple-rest-api.config'
import { ApiError, HttpClient } from './generated'
import type { QueryParamsType, RequestContext } from './generated'
import {
  SimpleAuthSessionChangedError,
  takeExpectedSimpleAuthSession
} from './auth-session-request'
import { refreshSimpleAccessToken } from './refresh-access-token'
import { getDemoScenario } from './request-context'

const requestSessionByContext = new WeakMap<RequestContext, SimpleAuthSessionIdentity>()

/**
 * Сериализует query тем же URLSearchParams-форматом, который используют SWR-ключи.
 */
const serializeSimpleQuery = (query: QueryParamsType): string => {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined) {
      return
    }

    if (isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)))
      return
    }

    searchParams.set(key, String(value))
  })

  return searchParams.toString()
}

/**
 * Транспорт Simple API с JWT refresh и управляемыми demo-заголовками.
 */
export const simpleHttpClient = new HttpClient({
  baseUrl: SIMPLE_REST_API_BASE_URL,
  timeout: SIMPLE_REST_API_TIMEOUT_MS,
  paramsSerializer: serializeSimpleQuery,
  onRequest: (params, context) => {
    const headers = new Headers(params.headers)
    const session = getSimpleAuthSession()
    const expectedSessionId = takeExpectedSimpleAuthSession(headers)

    headers.set('X-Demo-Scenario', getDemoScenario())

    if (
      params.secure &&
      expectedSessionId !== null &&
      session?.sessionId !== expectedSessionId
    ) {
      throw new SimpleAuthSessionChangedError()
    }

    if (params.secure && session !== null) {
      requestSessionByContext.set(context, {
        sessionId: session.sessionId,
        revision: session.revision
      })

      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${session.tokens.accessToken}`)
      }
    }

    return { ...params, headers }
  },
  onError: async (error, context) => {
    const requestSession = requestSessionByContext.get(context)
    const isUnauthorized =
      error instanceof ApiError && error.status === 401 && context.request.secure === true

    if (!isUnauthorized || requestSession === undefined) {
      throw error
    }

    if (context.retryCount > 0) {
      await clearSimpleAuthSession(requestSession)
      throw error
    }

    const nextRevision = await refreshSimpleAccessToken(requestSession)
    const currentSession = getSimpleAuthSession()

    const canRetry =
      nextRevision !== null &&
      currentSession !== null &&
      currentSession.sessionId === requestSession.sessionId &&
      currentSession.revision === nextRevision

    if (!canRetry) {
      throw error
    }

    return context.retry()
  }
})
