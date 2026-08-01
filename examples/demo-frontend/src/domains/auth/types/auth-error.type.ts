/**
 * Стабильные коды ожидаемых ошибок auth-сценариев.
 */
export type AuthErrorCode =
  | 'invalid-credentials'
  | 'session-expired'
  | 'access-denied'
  | 'service-unavailable'
  | 'unknown'

/**
 * Безопасная ошибка auth-домена.
 */
export type AuthError = {
  /** Код для UI-ветвления. */
  code: AuthErrorCode
  /** Сообщение без transport payload. */
  message: string
}
