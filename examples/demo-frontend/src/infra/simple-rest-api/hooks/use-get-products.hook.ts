import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'

import { simpleHttpClient } from '../client'
import type { ProductsResponseDto } from '../generated'
import { simpleProductsList } from '../generated/operations/simple-products-list'
import type { SimpleProductsQuery } from '../types'
import { toGeneratedProductsQuery } from '../types/to-generated-query'
import { createQueryString } from './lib/create-query-string'

/**
 * Возвращает endpoint query для выдачи продуктов.
 */
const getProductsPath = (params: SimpleProductsQuery): string => {
  return `/api/v1/products${createQueryString({
    page: params.page,
    limit: params.limit,
    search: params.search,
    categoryId: params.categoryId,
    sort: params.sort
  })}`
}

/**
 * Возвращает SWR-ключ текущей фильтрованной выдачи продуктов.
 */
export const getProductsKey = (
  params: SimpleProductsQuery = {}
): readonly ['simple-rest-api', string] => {
  return ['simple-rest-api', getProductsPath(params)] as const
}

/**
 * Получает одну страницу продуктов без доменной интерпретации DTO.
 */
export const useGetProducts = (
  params: SimpleProductsQuery = {},
  config?: SWRConfiguration<ProductsResponseDto, unknown>
): SWRResponse<ProductsResponseDto, unknown> => {
  const query = toGeneratedProductsQuery(params)

  return useSWR<ProductsResponseDto, unknown>(
    getProductsKey(params),
    () => simpleProductsList(simpleHttpClient, query),
    config
  )
}
