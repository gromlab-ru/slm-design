import type { Result } from '@/shared/types/result.type'

import type { OrderError } from './order-error.type'
import type { Order, OrderDraftLine } from './order.type'

/**
 * Public commands orders-домена в текущем REST cache scope.
 */
export type OrderCommands = {
  /** Создаёт заказ из validated draft в captured auth scope. */
  createOrder: (
    lines: OrderDraftLine[],
    sessionKey: string
  ) => Promise<Result<Order, OrderError>>
  /** Запрашивает допустимый backend transition в cancelled. */
  cancelOrder: (
    orderId: string,
    sessionKey: string
  ) => Promise<Result<Order, OrderError>>
}
