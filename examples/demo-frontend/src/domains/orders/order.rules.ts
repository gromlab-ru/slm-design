import { isNonEmptyArray } from '@/shared/lib/value-predicates'

import type { OrderError } from './types/order-error.type'
import type { Order, OrderDraftLine } from './types/order.type'

/**
 * Максимальное количество одной позиции по order contract Simple API.
 */
export const MAX_ORDER_LINE_QUANTITY = 20

/**
 * Проверяет order draft до отправки authority backend scenario.
 */
export const validateOrderDraft = (lines: OrderDraftLine[]): OrderError | null => {
  if (!isNonEmptyArray(lines)) {
    return { code: 'empty-order', message: 'Add at least one product before checkout.' }
  }

  const hasInvalidQuantity = lines.some(
    (line) =>
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_ORDER_LINE_QUANTITY
  )

  if (hasInvalidQuantity) {
    return {
      code: 'invalid-quantity',
      message: `Each order line must contain between 1 and ${MAX_ORDER_LINE_QUANTITY} units.`
    }
  }

  if (lines.some((line) => line.quantity > line.availableStock)) {
    return {
      code: 'insufficient-stock',
      message: 'Available stock changed. Review the cart before checkout.'
    }
  }

  if (lines.some((line) => line.currency !== 'USD')) {
    return {
      code: 'unsupported-currency',
      message: 'The Simple API checkout accepts USD products only.'
    }
  }

  return null
}

/**
 * Определяет доступность cancel transition по authority order status.
 */
export const canCancelOrder = (order: Order): boolean => {
  return order.status === 'pending' || order.status === 'paid'
}
