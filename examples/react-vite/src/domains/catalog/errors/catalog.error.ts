/** Ожидаемый неуспешный исход каталога. */
export type CatalogErrorCode =
  | 'forbidden'
  | 'not-found'
  | 'version-conflict'
  | 'invalid-input'
  | 'rate-limited'
  | 'invalid-data'
  | 'unavailable'

/**
 * Доменная ошибка чтения или изменения каталога.
 */
export class CatalogError extends Error {
  /** Стабильный код ожидаемого исхода. */
  readonly code: CatalogErrorCode

  constructor(code: CatalogErrorCode, message: string) {
    super(message)
    this.name = 'CatalogError'
    this.code = code
  }
}
