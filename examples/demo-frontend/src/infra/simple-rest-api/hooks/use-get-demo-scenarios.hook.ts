import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'

import { simpleHttpClient } from '../client'
import type { ScenariosResponseDto } from '../generated'
import { simpleTestingScenarios } from '../generated/operations/simple-testing-scenarios'

/**
 * Возвращает SWR-ключ справочника demo-сценариев.
 */
export const getDemoScenariosKey = (): readonly [
  'simple-rest-api',
  '/api/v1/testing/scenarios'
] => {
  return ['simple-rest-api', '/api/v1/testing/scenarios'] as const
}

/**
 * Получает описания управляемых сценариев fixture-бэкенда.
 */
export const useGetDemoScenarios = (
  config?: SWRConfiguration<ScenariosResponseDto, unknown>
): SWRResponse<ScenariosResponseDto, unknown> => {
  return useSWR<ScenariosResponseDto, unknown>(
    getDemoScenariosKey(),
    () => simpleTestingScenarios(simpleHttpClient),
    config
  )
}
