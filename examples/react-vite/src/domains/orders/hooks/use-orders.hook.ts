import { use } from 'react'

import { OrdersContext } from '../context/orders.context'
import type { OrdersContextValue } from '../types/orders-context-value.type'

/**
 * Возвращает публичные возможности draft order и checkout.
 */
export const useOrders = (): OrdersContextValue => {
  const orders = use(OrdersContext)

  if (!orders) {
    throw new Error('useOrders must be used inside OrdersProvider')
  }

  return orders
}
