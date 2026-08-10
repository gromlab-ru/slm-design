/** Ожидаемый неуспешный исход заказа. */
export type OrderErrorCode =
  | 'product-changed'
  | 'insufficient-stock'
  | 'unsupported-currency'
  | 'cannot-cancel'
  | 'not-found'
  | 'invalid-order'
  | 'rate-limited'
  | 'invalid-data'
  | 'unavailable'

/**
 * Доменная ошибка draft checkout или истории заказов.
 */
export class OrderError extends Error {
  /** Стабильный код ожидаемого исхода. */
  readonly code: OrderErrorCode

  constructor(code: OrderErrorCode, message: string) {
    super(message)
    this.name = 'OrderError'
    this.code = code
  }
}
