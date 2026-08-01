import useSWR from 'swr'
import type { SWRConfiguration, SWRResponse } from 'swr'

import { simpleHttpClient } from '../client'
import type { OrdersResponseDto } from '../generated'
import { simpleOrdersList } from '../generated/operations/simple-orders-list'
import type { SimpleOrdersQuery } from '../types'
import { toGeneratedOrdersQuery } from '../types/to-generated-query'
import { createQueryString } from './lib/create-query-string'

/**
 * Возвращает SWR-ключ заказов или блокирует защищённый запрос.
 */
export const getOrdersKey = (
  params?: SimpleOrdersQuery | null
): readonly ['simple-rest-api', string] | null => {
  if (params === null) {
    return null
  }

  const query = params ?? {}
  const path = `/api/v1/orders${createQueryString({ page: query.page, limit: query.limit })}`

  return ['simple-rest-api', path] as const
}

/**
 * Получает доступные текущему пользователю заказы.
 */
export const useGetOrders = (
  params?: SimpleOrdersQuery | null,
  config?: SWRConfiguration<OrdersResponseDto, unknown>
): SWRResponse<OrdersResponseDto, unknown> => {
  const query = toGeneratedOrdersQuery(params ?? {})

  return useSWR<OrdersResponseDto, unknown>(
    getOrdersKey(params),
    () => simpleOrdersList(simpleHttpClient, query),
    config
  )
}
