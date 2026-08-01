import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'

import { simpleHttpClient } from '../client'
import type { ProductResponseDto, SimpleProductsGetParams } from '../generated'
import { simpleProductsGet } from '../generated/operations/simple-products-get'

/**
 * Возвращает SWR-ключ продукта или блокирует запрос без id.
 */
export const getProductKey = (
  params?: SimpleProductsGetParams | null
): readonly ['simple-rest-api', string] | null => {
  if (!params?.id) {
    return null
  }

  return ['simple-rest-api', `/api/v1/products/${params.id}`] as const
}

/**
 * Получает продукт по идентификатору с отложенным запуском.
 */
export const useGetProduct = (
  params?: SimpleProductsGetParams | null,
  config?: SWRConfiguration<ProductResponseDto, unknown>
): SWRResponse<ProductResponseDto, unknown> => {
  const requestParams = params?.id ? params : { id: '' }

  return useSWR<ProductResponseDto, unknown>(
    getProductKey(params),
    () => simpleProductsGet(simpleHttpClient, requestParams),
    config
  )
}
