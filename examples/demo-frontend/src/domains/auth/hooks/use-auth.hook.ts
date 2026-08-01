'use client'

import { useContext } from 'react'

import { AuthContext } from '../auth.context'
import type { AuthContextValue } from '../types/auth-context.type'

/**
 * Возвращает application-scoped auth API текущего пользователя.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
