import { useSession } from './use-session.hook'
import type { SessionState } from '../types/session-state.type'

/**
 * Возвращает read-only состояние сессии для app и compositions.
 */
export const useSessionState = (): SessionState => {
  const { user, status } = useSession()

  return { user, status }
}
