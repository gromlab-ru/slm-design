import { readSimpleApiFailure } from '@/infra/simple-rest-api'

import type { AuthError } from '../types/auth-error.type'

/**
 * Переводит technical failure в ожидаемую ошибку auth-домена.
 */
export const mapAuthError = (error: unknown): AuthError => {
  const failure = readSimpleApiFailure(error)

  if (failure.code === 'INVALID_CREDENTIALS') {
    return { code: 'invalid-credentials', message: 'Email or password is incorrect.' }
  }

  if (failure.status === 401) {
    return { code: 'session-expired', message: 'Your session expired. Sign in again.' }
  }

  if (failure.status === 403) {
    return { code: 'access-denied', message: 'This account cannot perform that action.' }
  }

  if (failure.status === 0) {
    return { code: 'service-unavailable', message: failure.message }
  }

  return { code: 'unknown', message: 'Authentication could not be completed.' }
}
