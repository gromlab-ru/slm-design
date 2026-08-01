'use client'

import { useGetOrders } from '@/infra/simple-rest-api'

import { mapOrderError } from '../errors/order-error.mapper'
import { mapOrder } from '../mappers/order.mapper'
import type { OrdersState } from '../types/orders-state.type'

/**
 * Получает историю только после восстановления авторизованной сессии.
 */
export const useOrders = (isEnabled: boolean): OrdersState => {
  const query = useGetOrders(isEnabled ? { page: 1, limit: 50 } : null)

  return {
    orders: query.data?.data.map(mapOrder) ?? [],
    isLoading: isEnabled && query.isLoading,
    error: query.error ? mapOrderError(query.error) : null,
    reload: async () => {
      await query.mutate()
    }
  }
}
