/** Ожидаемый неуспешный исход сценария сессии. */
export type SessionErrorCode =
  | 'invalid-credentials'
  | 'rate-limited'
  | 'expired'
  | 'unavailable'

/**
 * Доменная ошибка входа или восстановления сессии.
 */
export class SessionError extends Error {
  /** Стабильный код ожидаемого исхода. */
  readonly code: SessionErrorCode

  constructor(code: SessionErrorCode, message: string) {
    super(message)
    this.name = 'SessionError'
    this.code = code
  }
}
