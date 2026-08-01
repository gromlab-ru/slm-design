import { readSimpleApiFailure } from '@/infra/simple-rest-api'

import type { CatalogError } from '../types/catalog-error.type'

/**
 * Переводит technical failure в ожидаемую ошибку catalog-домена.
 */
export const mapCatalogError = (error: unknown): CatalogError => {
  const failure = readSimpleApiFailure(error)

  if (failure.code === 'SESSION_CHANGED') {
    return { code: 'forbidden', message: 'The active admin session changed. Start again.' }
  }

  if (failure.status === 404) {
    return { code: 'not-found', message: 'The requested product no longer exists.' }
  }

  if (failure.status === 409) {
    return { code: 'conflict', message: 'This product changed. Reload it before saving again.' }
  }

  if (failure.status === 403) {
    return { code: 'forbidden', message: 'Administrator access is required.' }
  }

  if (failure.status === 400 || failure.status === 422) {
    return { code: 'validation', message: 'Check the submitted product fields.' }
  }

  if (failure.status === 0) {
    return { code: 'service-unavailable', message: failure.message }
  }

  return { code: 'unknown', message: 'The catalog request could not be completed.' }
}
