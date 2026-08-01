/**
 * Результат чтения browser storage без смешения missing и runtime failure.
 */
export type JsonStorageReadResult =
  | {
      /** Значение отсутствует. */
      status: 'missing'
    }
  | {
      /** JSON успешно прочитан и разобран. */
      status: 'value'
      /** Неизвестное значение внешней persistence boundary. */
      value: unknown
      /** Исходный serialized payload для conditional transitions. */
      rawValue: string
    }
  | {
      /** Persisted строка не является валидным JSON. */
      status: 'invalid'
      /** Исходный payload для conditional recovery. */
      rawValue: string
    }
  | {
      /** Storage или persisted JSON недоступны. */
      status: 'unavailable'
    }

const fallbackLocks = new Map<string, Promise<void>>()

/**
 * Читает JSON и сохраняет различие между missing value и storage failure.
 */
export const readJsonStorageResult = (key: string): JsonStorageReadResult => {
  if (typeof window === 'undefined') {
    return { status: 'missing' }
  }

  let rawValue: string | null

  try {
    rawValue = window.localStorage.getItem(key)
  } catch {
    return { status: 'unavailable' }
  }

  if (rawValue === null) {
    return { status: 'missing' }
  }

  try {
    return { status: 'value', value: JSON.parse(rawValue), rawValue }
  } catch {
    return { status: 'invalid', rawValue }
  }
}

/**
 * Читает JSON-значение из browser storage без доступа к нему при SSR.
 */
export const readJsonStorage = (key: string): unknown => {
  const result = readJsonStorageResult(key)

  return result.status === 'value' ? result.value : null
}

/**
 * Сохраняет сериализуемое значение в browser storage.
 */
export const writeJsonStorage = (key: string, value: unknown): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Удаляет значение из browser storage.
 */
export const removeStorageValue = (key: string): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/**
 * Сериализует storage transition между вкладками через Web Locks.
 *
 * Browser runtime без Web Locks завершается fail-closed; test/SSR realms
 * используют однопроцессную очередь, когда navigator отсутствует.
 */
export const withBrowserStorageLock = async <T>(
  name: string,
  action: () => Promise<T> | T
): Promise<T> => {
  if (typeof navigator !== 'undefined') {
    if (navigator.locks === undefined) {
      throw new Error('Web Locks are required for cross-tab storage transitions.')
    }

    return navigator.locks.request(name, action)
  }

  const previousLock = fallbackLocks.get(name) ?? Promise.resolve()
  let releaseLock = (): void => undefined
  const currentLock = new Promise<void>((resolve) => {
    releaseLock = resolve
  })
  const queuedLock = previousLock.then(() => currentLock)

  fallbackLocks.set(name, queuedLock)
  await previousLock

  try {
    return await action()
  } finally {
    releaseLock()

    if (fallbackLocks.get(name) === queuedLock) {
      fallbackLocks.delete(name)
    }
  }
}
