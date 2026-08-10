import useSWR from 'swr'
import type { SWRConfiguration } from 'swr'

import type { CategoriesResponseDto } from '../generated'
import { simpleCategoriesList } from '../generated/operations/simple-categories-list'
import { simpleHttpClient } from '../transport/client'

/**
 * Возвращает SWR-ключ списка категорий.
 */
export const getCategoryListKey = () => {
  return ['simple-rest-api', '/api/v1/categories'] as const
}

/**
 * Получает категории каталога с прозрачным SWR-кешированием.
 */
export const useGetCategoryList = (
  config?: SWRConfiguration<CategoriesResponseDto>
) => {
  return useSWR<CategoriesResponseDto>(
    getCategoryListKey(),
    () => simpleCategoriesList(simpleHttpClient),
    config
  )
}
