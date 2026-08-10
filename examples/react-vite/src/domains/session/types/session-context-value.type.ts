import type { SessionCredentials } from './session-credentials.type'
import type { SessionUser } from './session-user.type'

/** Состояние восстановления пользовательской сессии. */
export type SessionStatus = 'restoring' | 'authenticated' | 'anonymous'

/**
 * Публичные возможности домена пользовательской сессии.
 */
export type SessionContextValue = {
  /** Текущий пользователь или null вне авторизованной сессии. */
  user: SessionUser | null
  /** Текущее состояние lifecycle сессии. */
  status: SessionStatus
  /** Выполняет вход и открывает новую пользовательскую сессию. */
  login: (credentials: SessionCredentials) => Promise<void>
  /** Завершает пользовательскую сессию и отзывает refresh token. */
  logout: () => Promise<void>
}
