import { readSimpleApiFailure } from '@/infra/simple-rest-api'

import type { OrderError } from '../types/order-error.type'

/**
 * Переводит technical failure в ожидаемую ошибку orders-домена.
 */
export const mapOrderError = (error: unknown): OrderError => {
  const failure = readSimpleApiFailure(error)

  if (failure.code === 'EMPTY_ORDER') {
    return { code: 'empty-order', message: 'Add at least one product before checkout.' }
  }

  if (failure.code === 'INSUFFICIENT_STOCK') {
    return { code: 'insufficient-stock', message: 'Stock changed before the order was created.' }
  }

  if (failure.code === 'PRODUCT_CHANGED') {
    return { code: 'product-changed', message: 'A product changed after confirmation. Review the cart.' }
  }

  if (failure.code === 'DUPLICATE_ORDER_PRODUCT') {
    return { code: 'invalid-quantity', message: 'Each product may appear only once in an order.' }
  }

  if (failure.code === 'UNSUPPORTED_ORDER_CURRENCY') {
    return { code: 'unsupported-currency', message: 'The Simple API checkout accepts USD only.' }
  }

  if (failure.code === 'ORDER_CANNOT_BE_CANCELLED') {
    return { code: 'cannot-cancel', message: 'Only pending or paid orders can be cancelled.' }
  }

  if (failure.code === 'SESSION_CHANGED') {
    return { code: 'unauthorized', message: 'The active session changed. Start the action again.' }
  }

  if (failure.status === 404) {
    return { code: 'not-found', message: 'The order is not available.' }
  }

  if (failure.status === 401 || failure.status === 403) {
    return { code: 'unauthorized', message: 'Sign in with an account that can access this order.' }
  }

  if (failure.status === 0) {
    return { code: 'service-unavailable', message: failure.message }
  }

  return { code: 'unknown', message: 'The order request could not be completed.' }
}
