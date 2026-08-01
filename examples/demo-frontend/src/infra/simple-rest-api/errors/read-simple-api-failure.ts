import { hasOwn, isRecord, isString } from '@/shared/lib/value-predicates'

import { ApiError } from '../generated'
import { SimpleAuthSessionChangedError } from '../auth-session-request'
import type { SimpleApiFailure } from './simple-api-failure.type'

/**
 * Нормализует ошибку транспорта без публикации generated ApiError наружу.
 */
export const readSimpleApiFailure = (error: unknown): SimpleApiFailure => {
  if (error instanceof SimpleAuthSessionChangedError) {
    return {
      status: 401,
      code: 'SESSION_CHANGED',
      message: 'The active auth session changed before the request was sent.'
    }
  }

  if (error instanceof ApiError) {
    const payload = error.error
    const code = isRecord(payload) && hasOwn(payload, 'code') && isString(payload.code)
      ? payload.code
      : 'HTTP_ERROR'
    const message = isRecord(payload) && hasOwn(payload, 'message') && isString(payload.message)
      ? payload.message
      : 'Simple API returned an error.'

    return { status: error.status, code, message }
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return {
      status: 0,
      code: 'REQUEST_TIMEOUT',
      message: 'Simple API did not respond before the request timeout.'
    }
  }

  return {
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Simple API is unavailable. Start demo-backend on port 3001.'
  }
}
