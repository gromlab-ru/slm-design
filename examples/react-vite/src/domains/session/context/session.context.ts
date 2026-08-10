import { createContext } from 'react'

import type { SessionContextValue } from '../types/session-context-value.type'

/** React-контекст application-scoped пользовательской сессии. */
export const SessionContext = createContext<SessionContextValue | null>(null)
