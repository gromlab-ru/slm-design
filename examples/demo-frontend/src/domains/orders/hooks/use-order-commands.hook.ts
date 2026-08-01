'use client'

import {
  createSimpleAuthSessionRequest,
  simpleRestApi,
  useSimpleRestApiCache
} from '@/infra/simple-rest-api'

import { mapOrderError } from '../errors/order-error.mapper'
import { mapOrder } from '../mappers/order.mapper'
import { validateOrderDraft } from '../order.rules'
import type { OrderCommands } from '../types/order-command.type'

/**
 * Возвращает order commands, привязанные к текущему REST cache scope.
 */
export const useOrderCommands = (): OrderCommands => {
  const cache = useSimpleRestApiCache()

  /**
   * Создаёт order только после domain-owned draft validation.
   */
  const createOrder: OrderCommands['createOrder'] = async (lines, sessionKey) => {
    const validationError = validateOrderDraft(lines)

    if (validationError !== null) {
      return { isSuccess: false, error: validationError }
    }

    try {
      const response = await simpleRestApi.orders.simpleOrdersCreate(
        {
          items: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            expectedVersion: line.expectedVersion,
            expectedUnitPriceCents: line.expectedUnitPriceCents
          }))
        },
        createSimpleAuthSessionRequest(sessionKey)
      )
      const order = mapOrder(response.data)

      await cache.invalidateOrders()

      return { isSuccess: true, data: order }
    } catch (error) {
      return { isSuccess: false, error: mapOrderError(error) }
    }
  }

  /**
   * Запрашивает cancel transition и ревалидирует только orders.
   */
  const cancelOrder: OrderCommands['cancelOrder'] = async (orderId, sessionKey) => {
    try {
      const response = await simpleRestApi.orders.simpleOrdersCancel(
        { id: orderId },
        createSimpleAuthSessionRequest(sessionKey)
      )
      const order = mapOrder(response.data)

      await cache.invalidateOrders()

      return { isSuccess: true, data: order }
    } catch (error) {
      return { isSuccess: false, error: mapOrderError(error) }
    }
  }

  return { createOrder, cancelOrder }
}
