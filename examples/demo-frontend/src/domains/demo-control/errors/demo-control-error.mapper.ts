import { readSimpleApiFailure } from '@/infra/simple-rest-api'

import type { DemoControlError } from '../types/demo-control.type'

/**
 * Переводит technical failure в ожидаемую demo-control ошибку.
 */
export const mapDemoControlError = (error: unknown): DemoControlError => {
  const failure = readSimpleApiFailure(error)

  if (failure.status === 0) {
    return { code: 'service-unavailable', message: failure.message }
  }

  return { code: 'rejected', message: 'The fixture rejected this control action.' }
}
