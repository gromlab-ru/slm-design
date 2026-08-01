'use client'

import { AuthProvider, useAuth } from '@/domains/auth'
import { CartProvider } from '@/domains/cart'
import { SimpleRestApiProvider } from '@/infra/simple-rest-api'

import type { AppLayoutProps } from './types/app-layout-props.type'

/**
 * Создаёт новый REST cache при каждой смене logical auth session.
 *
 * Используется для:
 *  - исключения DTO предыдущего пользователя из нового session scope
 */
const AuthScopedRestApiProvider = (props: AppLayoutProps) => {
  const { children } = props
  const auth = useAuth()
  const cacheScopeKey = auth.status === 'checking'
    ? `checking:${auth.sessionKey ?? 'anonymous'}`
    : auth.sessionKey ?? auth.status

  return (
    <SimpleRestApiProvider
      key={cacheScopeKey}
      isPaused={auth.status === 'checking'}
    >
      {children}
    </SimpleRestApiProvider>
  )
}

/**
 * Подключает application-scoped domain state и auth-scoped REST cache.
 *
 * Используется для:
 *  - сохранения auth/cart state между route transitions
 *  - пересоздания technical cache на границе пользовательской сессии
 */
export const AppProviders = (props: AppLayoutProps) => {
  const { children } = props

  return (
    <AuthProvider>
      <CartProvider>
        <AuthScopedRestApiProvider>{children}</AuthScopedRestApiProvider>
      </CartProvider>
    </AuthProvider>
  )
}
