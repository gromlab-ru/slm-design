'use client'

import { startTransition, useEffect, useRef, useState } from 'react'

import {
  clearSimpleAuthSessionScope,
  discardSimpleAuthSession,
  readSimpleAuthSession,
  replaceSimpleAuthSession,
  subscribeSimpleAuthSession
} from '@/infra/simple-auth-session'
import type { SimpleAuthSession } from '@/infra/simple-auth-session'
import { simpleRestApi } from '@/infra/simple-rest-api'
import type { Result } from '@/shared/types/result.type'

import { AuthContext } from './auth.context'
import { mapAuthError } from './errors/auth-error.mapper'
import { mapAuthUser } from './mappers/auth-user.mapper'
import type { AuthError } from './types/auth-error.type'
import type { AuthContextValue, SignInCredentials } from './types/auth-context.type'
import type { AuthProviderProps } from './types/auth-provider-props.type'
import type { AuthUser } from './types/auth-user.type'

const SESSION_STORAGE_ERROR: AuthError = {
  code: 'service-unavailable',
  message: 'Browser storage is unavailable. The session was not changed.'
}
const SESSION_CHANGED_ERROR: AuthError = {
  code: 'session-expired',
  message: 'The active session changed before the request completed.'
}

/**
 * Владеет пользовательской сессией на всём времени жизни приложения.
 *
 * Используется для:
 *  - восстановления профиля из CAS-protected JWT session
 *  - предоставления login/logout API всем composition-модулям
 */
export const AuthProvider = (props: AuthProviderProps) => {
  const { children } = props
  const [status, setStatus] = useState<AuthContextValue['status']>('checking')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionKey, setSessionKey] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<AuthError | null>(null)
  const sessionKeyRef = useRef<string | null>(null)
  const profileRequestIdRef = useRef(0)

  useEffect(() => {
    let isActive = true

    /**
     * Загружает authority-профиль только для всё ещё актуальной session scope.
     */
    const loadSessionUser = async (session: SimpleAuthSession): Promise<void> => {
      const requestId = ++profileRequestIdRef.current

      try {
        const response = await simpleRestApi.users.simpleUsersMe()
        const currentResult = readSimpleAuthSession()

        if (
          !isActive ||
          requestId !== profileRequestIdRef.current
        ) {
          return
        }

        if (currentResult.status === 'unavailable') {
          setSessionError(SESSION_STORAGE_ERROR)
          setStatus('unavailable')
          return
        }

        if (currentResult.session?.sessionId !== session.sessionId) {
          return
        }

        startTransition(() => {
          sessionKeyRef.current = session.sessionId
          setSessionKey(session.sessionId)
          setUser(mapAuthUser(response.data))
          setSessionError(null)
          setStatus('authenticated')
        })
      } catch (error) {
        const currentResult = readSimpleAuthSession()

        if (!isActive || requestId !== profileRequestIdRef.current) {
          return
        }

        if (currentResult.status === 'unavailable') {
          setSessionError(SESSION_STORAGE_ERROR)
          setStatus('unavailable')
          return
        }

        const currentSession = currentResult.session

        if (currentSession === null) {
          sessionKeyRef.current = null
          setSessionKey(null)
          setUser(null)
          setSessionError(null)
          setStatus('guest')
          return
        }

        if (currentSession.sessionId === session.sessionId) {
          startTransition(() => {
            sessionKeyRef.current = session.sessionId
            setSessionKey(session.sessionId)
            setSessionError(mapAuthError(error))
            setStatus('unavailable')
          })
        }
      }
    }

    const unsubscribe = subscribeSimpleAuthSession((result) => {
      if (!isActive) {
        return
      }

      if (result.status === 'unavailable') {
        profileRequestIdRef.current += 1
        setSessionError(SESSION_STORAGE_ERROR)
        setStatus('unavailable')
        return
      }

      const session = result.session

      if (session === null) {
        profileRequestIdRef.current += 1
        sessionKeyRef.current = null
        setSessionKey(null)
        setUser(null)
        setSessionError(null)
        setStatus('guest')
        return
      }

      if (session.sessionId !== sessionKeyRef.current) {
        profileRequestIdRef.current += 1
        sessionKeyRef.current = session.sessionId
        setSessionKey(session.sessionId)
        setUser(null)
        setSessionError(null)
        setStatus('checking')
        void loadSessionUser(session)
      }
    })
    const initialResult = readSimpleAuthSession()

    if (initialResult.status === 'unavailable') {
      queueMicrotask(() => {
        if (isActive) {
          setSessionError(SESSION_STORAGE_ERROR)
          setStatus('unavailable')
        }
      })
    } else if (initialResult.session === null) {
      queueMicrotask(() => {
        if (isActive) {
          setStatus('guest')
        }
      })
    } else {
      const session = initialResult.session

      sessionKeyRef.current = session.sessionId
      void loadSessionUser(session)
    }

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  /**
   * Выполняет login и создаёт новую logical session scope.
   */
  const signIn = async (
    credentials: SignInCredentials
  ): Promise<Result<AuthUser, AuthError>> => {
    try {
      const response = await simpleRestApi.auth.simpleAuthLogin(credentials)
      const nextUser = mapAuthUser(response.data.user)
      const session = await replaceSimpleAuthSession(response.data.tokens)

      if (session === null) {
        return { isSuccess: false, error: SESSION_STORAGE_ERROR }
      }

      startTransition(() => {
        profileRequestIdRef.current += 1
        sessionKeyRef.current = session.sessionId
        setSessionKey(session.sessionId)
        setUser(nextUser)
        setSessionError(null)
        setStatus('authenticated')
      })

      return { isSuccess: true, data: nextUser }
    } catch (error) {
      return { isSuccess: false, error: mapAuthError(error) }
    }
  }

  /**
   * Локально завершает session до best-effort backend logout.
   */
  const signOut = async (): Promise<void> => {
    const currentResult = readSimpleAuthSession()

    if (currentResult.status === 'unavailable') {
      if (currentResult.observedValue === null) {
        setSessionError(SESSION_STORAGE_ERROR)
        setStatus('unavailable')
        return
      }

      const isDiscarded = await discardSimpleAuthSession(currentResult.observedValue)

      if (!isDiscarded) {
        const latestResult = readSimpleAuthSession()

        if (latestResult.status === 'unavailable') {
          setSessionError(SESSION_STORAGE_ERROR)
          setStatus('unavailable')
        }
        return
      }

      profileRequestIdRef.current += 1
      sessionKeyRef.current = null
      setSessionKey(null)
      setUser(null)
      setSessionError(null)
      setStatus('guest')
      return
    }

    const session = currentResult.session

    if (session === null) {
      profileRequestIdRef.current += 1
      sessionKeyRef.current = null
      setSessionKey(null)
      setUser(null)
      setSessionError(null)
      setStatus('guest')
      return
    }

    const isCleared = await clearSimpleAuthSessionScope(session.sessionId)

    if (!isCleared) {
      setSessionError(SESSION_STORAGE_ERROR)
      setStatus('unavailable')
      return
    }

    profileRequestIdRef.current += 1
    sessionKeyRef.current = null
    setSessionKey(null)
    setUser(null)
    setSessionError(null)
    setStatus('guest')

    try {
      await simpleRestApi.auth.simpleAuthLogout({
        refreshToken: session.tokens.refreshToken
      })
    } catch {
      // Remote revocation is best-effort after the local scope is already closed.
    }
  }

  /**
   * Обновляет authority-профиль или публикует recoverable session failure.
   */
  const refreshCurrentUser = async (): Promise<Result<AuthUser, AuthError>> => {
    const expectedResult = readSimpleAuthSession()

    if (expectedResult.status === 'unavailable') {
      setSessionError(SESSION_STORAGE_ERROR)
      setStatus('unavailable')
      return { isSuccess: false, error: SESSION_STORAGE_ERROR }
    }

    const expectedSession = expectedResult.session

    if (expectedSession === null) {
      profileRequestIdRef.current += 1
      sessionKeyRef.current = null
      setSessionKey(null)
      setUser(null)
      setSessionError(null)
      setStatus('guest')
      return { isSuccess: false, error: SESSION_CHANGED_ERROR }
    }

    const requestId = ++profileRequestIdRef.current

    try {
      const response = await simpleRestApi.users.simpleUsersMe()
      const nextUser = mapAuthUser(response.data)
      const currentResult = readSimpleAuthSession()

      if (currentResult.status === 'unavailable') {
        setSessionError(SESSION_STORAGE_ERROR)
        setStatus('unavailable')
        return { isSuccess: false, error: SESSION_STORAGE_ERROR }
      }

      const currentSession = currentResult.session

      if (
        requestId !== profileRequestIdRef.current ||
        currentSession?.sessionId !== expectedSession.sessionId
      ) {
        return { isSuccess: false, error: SESSION_CHANGED_ERROR }
      }

      startTransition(() => {
        sessionKeyRef.current = expectedSession.sessionId
        setSessionKey(expectedSession.sessionId)
        setUser(nextUser)
        setSessionError(null)
        setStatus('authenticated')
      })

      return { isSuccess: true, data: nextUser }
    } catch (error) {
      const authError = mapAuthError(error)
      const currentResult = readSimpleAuthSession()

      if (currentResult.status === 'unavailable') {
        setSessionError(SESSION_STORAGE_ERROR)
        setStatus('unavailable')
        return { isSuccess: false, error: SESSION_STORAGE_ERROR }
      }

      const currentSession = currentResult.session

      if (
        requestId !== profileRequestIdRef.current ||
        currentSession?.sessionId !== expectedSession.sessionId
      ) {
        return { isSuccess: false, error: SESSION_CHANGED_ERROR }
      }

      startTransition(() => {
        sessionKeyRef.current = expectedSession.sessionId
        setSessionKey(expectedSession.sessionId)
        setSessionError(authError)
        setStatus('unavailable')
      })

      return { isSuccess: false, error: authError }
    }
  }

  /**
   * Сверяет captured session scope с domain state и persisted authority.
   */
  const isCurrentSession = (expectedSessionKey: string): boolean => {
    const currentResult = readSimpleAuthSession()
    const persistedSession = currentResult.status === 'ready' ? currentResult.session : null

    return (
      sessionKeyRef.current === expectedSessionKey &&
      persistedSession?.sessionId === expectedSessionKey
    )
  }

  const value: AuthContextValue = {
    status,
    user,
    sessionKey,
    sessionError,
    isCurrentSession,
    signIn,
    signOut,
    refreshCurrentUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
