import { use } from 'react'

import { SessionContext } from '../context/session.context'
import type { SessionContextValue } from '../types/session-context-value.type'

/**
 * Возвращает публичные возможности текущей пользовательской сессии.
 */
export const useSession = (): SessionContextValue => {
  const session = use(SessionContext)

  if (!session) {
    throw new Error('useSession must be used inside SessionProvider')
  }

  return session
}
