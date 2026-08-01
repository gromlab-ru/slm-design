/**
 * Коды ожидаемых ошибок заказа.
 */
export type OrderErrorCode =
  | 'empty-order'
  | 'invalid-quantity'
  | 'unsupported-currency'
  | 'not-found'
  | 'cannot-cancel'
  | 'insufficient-stock'
  | 'product-changed'
  | 'unauthorized'
  | 'service-unavailable'
  | 'unknown'

/**
 * Безопасная ошибка orders-домена.
 */
export type OrderError = {
  /** Код для выбора route outcome. */
  code: OrderErrorCode
  /** Сообщение без transport payload. */
  message: string
}
