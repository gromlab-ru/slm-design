import useSWR from 'swr'
import type { SWRConfiguration } from 'swr'

import type { ProductsResponseDto, SimpleProductsListParams } from '../generated'
import { simpleProductsList } from '../generated/operations/simple-products-list'
import { simpleHttpClient } from '../transport/client'
import type { GetProductsParams } from '../types'
import { createQueryString } from './lib/create-query-string'

/**
 * Возвращает SWR-ключ списка продуктов с фактическим endpoint.
 */
export const getProductListKey = (params: GetProductsParams = {}) => {
  const query = createQueryString(params)

  return ['simple-rest-api', `/api/v1/products${query}`] as const
}

/**
 * Получает страницу продуктов с прозрачным SWR-кешированием.
 */
export const useGetProductList = (
  params: GetProductsParams = {},
  config?: SWRConfiguration<ProductsResponseDto>
) => {
  const fetcher = () => {
    // Backend schema types page and limit as Object although the wire values are numbers.
    const generatedParams = params as unknown as SimpleProductsListParams
    return simpleProductsList(simpleHttpClient, generatedParams)
  }

  return useSWR<ProductsResponseDto>(getProductListKey(params), fetcher, config)
}
