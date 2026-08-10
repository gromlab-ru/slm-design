import { useEffect, useEffectEvent, useState } from 'react'

import { subscribeSimpleRestApiSessionExpired } from 'infra/simple-rest-api'
import { SessionContext } from './context/session.context'
import { loginSession, logoutSession, restoreSession } from './source/session.source'
import type { SessionCredentials } from './types/session-credentials.type'
import type { SessionProviderProps } from './types/session-provider-props.type'
import type { SessionStatus } from './types/session-context-value.type'
import type { SessionUser } from './types/session-user.type'

/**
 * Владелец application-scoped пользовательской сессии.
 *
 * Используется для:
 *  - восстановления пользователя при загрузке browser-приложения
 *  - синхронизации login, logout и окончательного истечения credentials
 */
export const SessionProvider = (props: SessionProviderProps) => {
  const { children, onSessionClosed } = props
  const [user, setUser] = useState<SessionUser | null>(null)
  const [status, setStatus] = useState<SessionStatus>('restoring')

  const handleSessionExpired = useEffectEvent(() => {
    setUser(null)
    setStatus('anonymous')
    onSessionClosed?.()
  })

  useEffect(() => {
    let isActive = true

    void restoreSession()
      .then((restoredUser) => {
        if (!isActive) {
          return
        }

        setUser(restoredUser)
        setStatus(restoredUser ? 'authenticated' : 'anonymous')
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        handleSessionExpired()
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    return subscribeSimpleRestApiSessionExpired(handleSessionExpired)
  }, [])

  /**
   * Выполняет вход и публикует нового пользователя в session context.
   */
  const login = async (credentials: SessionCredentials): Promise<void> => {
    const authenticatedUser = await loginSession(credentials)
    setUser(authenticatedUser)
    setStatus('authenticated')
  }

  /**
   * Завершает сессию независимо от доступности logout endpoint.
   */
  const logout = async (): Promise<void> => {
    try {
      await logoutSession()
    } catch {
      // Local session still closes when the idempotent revoke endpoint is unavailable.
    } finally {
      setUser(null)
      setStatus('anonymous')
      onSessionClosed?.()
    }
  }

  return (
    <SessionContext value={{ user, status, login, logout }}>
      {children}
    </SessionContext>
  )
}
