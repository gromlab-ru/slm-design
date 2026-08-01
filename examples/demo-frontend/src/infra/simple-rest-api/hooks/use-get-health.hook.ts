import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'

import { simpleHttpClient } from '../client'
import type { HealthResponseDto } from '../generated'
import { simpleHealthHealth } from '../generated/operations/simple-health-health'

/**
 * Возвращает SWR-ключ проверки доступности Simple API.
 */
export const getHealthKey = (): readonly ['simple-rest-api', '/api/v1/health'] => {
  return ['simple-rest-api', '/api/v1/health'] as const
}

/**
 * Получает технический health-снимок Simple API.
 */
export const useGetHealth = (
  config?: SWRConfiguration<HealthResponseDto, unknown>
): SWRResponse<HealthResponseDto, unknown> => {
  return useSWR<HealthResponseDto, unknown>(
    getHealthKey(),
    () => simpleHealthHealth(simpleHttpClient),
    config
  )
}
