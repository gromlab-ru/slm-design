/**
 * Коды ожидаемых ошибок каталога.
 */
export type CatalogErrorCode =
  | 'not-found'
  | 'conflict'
  | 'forbidden'
  | 'validation'
  | 'service-unavailable'
  | 'unknown'

/**
 * Безопасная ошибка catalog-домена.
 */
export type CatalogError = {
  /** Код для выбора UI outcome. */
  code: CatalogErrorCode
  /** Сообщение без backend payload. */
  message: string
}
