import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'

import { simpleHttpClient } from '../client'
import type { CategoriesResponseDto } from '../generated'
import { simpleCategoriesList } from '../generated/operations/simple-categories-list'

/**
 * Возвращает SWR-ключ списка категорий.
 */
export const getCategoriesKey = (): readonly ['simple-rest-api', '/api/v1/categories'] => {
  return ['simple-rest-api', '/api/v1/categories'] as const
}

/**
 * Получает категории каталога без доменной интерпретации DTO.
 */
export const useGetCategories = (
  config?: SWRConfiguration<CategoriesResponseDto, unknown>
): SWRResponse<CategoriesResponseDto, unknown> => {
  return useSWR<CategoriesResponseDto, unknown>(
    getCategoriesKey(),
    () => simpleCategoriesList(simpleHttpClient),
    config
  )
}
