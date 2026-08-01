import { createContext } from 'react'

import type { AuthContextValue } from './types/auth-context.type'

/**
 * Внутренний React context application-scoped auth API.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
