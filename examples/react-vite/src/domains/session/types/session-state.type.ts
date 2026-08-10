import type { SessionStatus } from './session-context-value.type'
import type { SessionUser } from './session-user.type'

/**
 * Публичное read-only состояние пользовательской сессии.
 */
export type SessionState = {
  /** Текущий пользователь или null вне авторизованной сессии. */
  user: SessionUser | null
  /** Текущее состояние session lifecycle. */
  status: SessionStatus
}
