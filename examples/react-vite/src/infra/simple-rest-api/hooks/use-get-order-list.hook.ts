import useSWR from 'swr'
import type { SWRConfiguration } from 'swr'

import type { OrdersResponseDto, SimpleOrdersListParams } from '../generated'
import { simpleOrdersList } from '../generated/operations/simple-orders-list'
import { simpleHttpClient } from '../transport/client'
import type { GetOrdersParams } from '../types'
import { createQueryString } from './lib/create-query-string'

/**
 * Возвращает SWR-ключ списка заказов с фактическим endpoint.
 */
export const getOrderListKey = (params: GetOrdersParams = {}) => {
  const query = createQueryString(params)

  return ['simple-rest-api', `/api/v1/orders${query}`] as const
}

/**
 * Получает страницу доступных пользователю заказов.
 */
export const useGetOrderList = (
  params: GetOrdersParams = {},
  config?: SWRConfiguration<OrdersResponseDto>
) => {
  const fetcher = () => {
    // Backend schema types page and limit as Object although the wire values are numbers.
    const generatedParams = params as unknown as SimpleOrdersListParams
    return simpleOrdersList(simpleHttpClient, generatedParams)
  }

  return useSWR<OrdersResponseDto>(getOrderListKey(params), fetcher, config)
}
