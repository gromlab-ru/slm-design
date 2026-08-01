import {
  readJsonStorageResult,
  removeStorageValue,
  withBrowserStorageLock,
  writeJsonStorage
} from '@/infra/browser-storage'
import { hasOwn, isNumber, isRecord, isString } from '@/shared/lib/value-predicates'

import type {
  SimpleAuthSession,
  SimpleAuthSessionIdentity,
  SimpleAuthSessionListener,
  SimpleAuthSessionReadResult,
  SimpleAuthTokens
} from './types/simple-auth-tokens.type'

const SIMPLE_AUTH_SESSION_KEY = 'demo-frontend:simple-auth-session'
const SIMPLE_AUTH_SESSION_LOCK = 'demo-frontend:simple-auth-session-lock'
const SIMPLE_AUTH_REFRESH_LOCK = 'demo-frontend:simple-auth-refresh-lock'
const sessionListeners = new Set<SimpleAuthSessionListener>()

/**
 * Проверяет сохранённый technical JWT payload.
 */
const isSimpleAuthTokens = (value: unknown): value is SimpleAuthTokens => {
  return (
    isRecord(value) &&
    hasOwn(value, 'accessToken') &&
    isString(value.accessToken) &&
    hasOwn(value, 'refreshToken') &&
    isString(value.refreshToken) &&
    hasOwn(value, 'expiresIn') &&
    isNumber(value.expiresIn)
  )
}

/**
 * Проверяет persisted technical session перед использованием транспортом.
 */
const isSimpleAuthSession = (value: unknown): value is SimpleAuthSession => {
  return (
    isRecord(value) &&
    hasOwn(value, 'sessionId') &&
    isString(value.sessionId) &&
    hasOwn(value, 'revision') &&
    isString(value.revision) &&
    hasOwn(value, 'tokens') &&
    isSimpleAuthTokens(value.tokens)
  )
}

/**
 * Создаёт непрозрачный идентификатор session или token revision.
 */
const createSessionIdentifier = (): string => {
  return globalThis.crypto.randomUUID()
}

/**
 * Уведомляет активных владельцев auth-state о persisted transition.
 */
const notifySessionListeners = (session: SimpleAuthSession | null): void => {
  sessionListeners.forEach((listener) => listener({ status: 'ready', session }))
}

/**
 * Сравнивает persisted session с ожидаемой CAS identity.
 */
const hasExpectedIdentity = (
  session: SimpleAuthSession,
  expected: SimpleAuthSessionIdentity
): boolean => {
  return session.sessionId === expected.sessionId && session.revision === expected.revision
}

/**
 * Возвращает валидную persisted technical session.
 */
export const getSimpleAuthSession = (): SimpleAuthSession | null => {
  const result = readSimpleAuthSession()

  return result.status === 'ready' ? result.session : null
}

/**
 * Читает persisted auth state без смешения missing и storage failure.
 */
export const readSimpleAuthSession = (): SimpleAuthSessionReadResult => {
  const result = readJsonStorageResult(SIMPLE_AUTH_SESSION_KEY)

  if (result.status === 'missing') {
    return { status: 'ready', session: null }
  }

  if (result.status === 'unavailable') {
    return { status: 'unavailable', observedValue: null }
  }

  if (result.status === 'invalid') {
    return { status: 'unavailable', observedValue: result.rawValue }
  }

  if (!isSimpleAuthSession(result.value)) {
    return { status: 'unavailable', observedValue: result.rawValue }
  }

  return { status: 'ready', session: result.value }
}

/**
 * Создаёт новую session scope после успешного login.
 */
export const replaceSimpleAuthSession = (
  tokens: SimpleAuthTokens
): Promise<SimpleAuthSession | null> => {
  return withBrowserStorageLock(SIMPLE_AUTH_SESSION_LOCK, () => {
    const session: SimpleAuthSession = {
      sessionId: createSessionIdentifier(),
      revision: createSessionIdentifier(),
      tokens
    }

    if (!writeJsonStorage(SIMPLE_AUTH_SESSION_KEY, session)) {
      return null
    }

    notifySessionListeners(session)

    return session
  }).catch(() => null)
}

/**
 * Атомарно вращает JWT только пока исходная session revision актуальна.
 */
export const rotateSimpleAuthSession = (
  expected: SimpleAuthSessionIdentity,
  tokens: SimpleAuthTokens
): Promise<SimpleAuthSession | null> => {
  return withBrowserStorageLock(SIMPLE_AUTH_SESSION_LOCK, () => {
    const currentResult = readSimpleAuthSession()

    if (currentResult.status !== 'ready') {
      return null
    }

    const currentSession = currentResult.session

    if (currentSession === null || !hasExpectedIdentity(currentSession, expected)) {
      return null
    }

    const nextSession: SimpleAuthSession = {
      sessionId: currentSession.sessionId,
      revision: createSessionIdentifier(),
      tokens
    }

    if (!writeJsonStorage(SIMPLE_AUTH_SESSION_KEY, nextSession)) {
      return null
    }

    notifySessionListeners(nextSession)

    return nextSession
  }).catch(() => null)
}

/**
 * Очищает session только если stale request всё ещё владеет её revision.
 */
export const clearSimpleAuthSession = (
  expected?: SimpleAuthSessionIdentity
): Promise<boolean> => {
  return withBrowserStorageLock(SIMPLE_AUTH_SESSION_LOCK, () => {
    const currentResult = readSimpleAuthSession()

    if (currentResult.status !== 'ready') {
      return false
    }

    const currentSession = currentResult.session

    if (currentSession === null) {
      return true
    }

    if (expected !== undefined && !hasExpectedIdentity(currentSession, expected)) {
      return false
    }

    if (!removeStorageValue(SIMPLE_AUTH_SESSION_KEY)) {
      return false
    }

    notifySessionListeners(null)

    return true
  }).catch(() => false)
}

/**
 * Закрывает logical session независимо от конкурентной JWT-ротации.
 */
export const clearSimpleAuthSessionScope = (
  sessionId: string
): Promise<boolean> => {
  return withBrowserStorageLock(SIMPLE_AUTH_SESSION_LOCK, () => {
    const currentResult = readSimpleAuthSession()

    if (currentResult.status !== 'ready') {
      return false
    }

    const currentSession = currentResult.session

    if (currentSession === null) {
      return true
    }

    if (currentSession.sessionId !== sessionId) {
      return false
    }

    if (!removeStorageValue(SIMPLE_AUTH_SESSION_KEY)) {
      return false
    }

    notifySessionListeners(null)

    return true
  }).catch(() => false)
}

/**
 * Удаляет unreadable или corrupt session без предварительного чтения payload.
 */
export const discardSimpleAuthSession = (observedValue: string): Promise<boolean> => {
  return withBrowserStorageLock(SIMPLE_AUTH_SESSION_LOCK, () => {
    const currentResult = readJsonStorageResult(SIMPLE_AUTH_SESSION_KEY)

    if (currentResult.status === 'missing') {
      return true
    }

    if (
      currentResult.status === 'unavailable' ||
      currentResult.rawValue !== observedValue
    ) {
      return false
    }

    if (!removeStorageValue(SIMPLE_AUTH_SESSION_KEY)) {
      return false
    }

    notifySessionListeners(null)

    return true
  }).catch(() => false)
}

/**
 * Выполняет refresh-flow эксклюзивно для всех вкладок одного origin.
 */
export const withSimpleAuthRefreshLock = <T>(
  action: () => Promise<T>
): Promise<T> => withBrowserStorageLock(SIMPLE_AUTH_REFRESH_LOCK, action)

/**
 * Подписывает auth owner на local и cross-tab transitions с обязательной очисткой.
 */
export const subscribeSimpleAuthSession = (listener: SimpleAuthSessionListener): (() => void) => {
  sessionListeners.add(listener)

  /**
   * Передаёт cross-tab storage transition текущему subscriber.
   */
  const handleStorage = (event: StorageEvent): void => {
    if (event.key === SIMPLE_AUTH_SESSION_KEY) {
      listener(readSimpleAuthSession())
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage)
  }

  return () => {
    sessionListeners.delete(listener)

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage)
    }
  }
}
