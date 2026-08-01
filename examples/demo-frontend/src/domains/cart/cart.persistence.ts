import { hasOwn, isArrayOf, isNumber, isOneOf, isRecord, isString } from '@/shared/lib/value-predicates'
import {
  readJsonStorageResult,
  withBrowserStorageLock,
  writeJsonStorage
} from '@/infra/browser-storage'

import { isSupportedProductImageUrl } from '@/domains/catalog'
import type { Product } from '@/domains/catalog'

import { getCartProductQuantityLimit } from './cart.logic'
import type { CartLine } from './types/cart.type'

const CURRENCIES = ['USD', 'EUR'] as const
const CART_STORAGE_KEY = 'demo-frontend:cart'
const CART_STORAGE_LOCK = 'demo-frontend:cart-lock'

/**
 * Создаёт revision, сохраняющую порядок обычных updates и forced recovery.
 */
const createCartRevision = (currentRevision = 0): number => {
  return Math.max(currentRevision + 1, Date.now() * 1000)
}

/**
 * Persisted cart snapshot с cross-tab monotonic revision.
 */
export type PersistedCartSnapshot = {
  /** Монотонная revision, увеличиваемая под storage lock. */
  revision: number
  /** Валидированные product snapshots и quantities. */
  lines: CartLine[]
}

/**
 * Результат чтения persisted cart repository.
 */
export type PersistedCartReadResult =
  | {
      /** Repository доступен. */
      status: 'ready'
      /** Последний snapshot либо null до инициализации. */
      snapshot: PersistedCartSnapshot | null
      /** Требуется ли commit мигрированного legacy payload. */
      shouldCommit: boolean
    }
  | {
      /** Browser storage временно недоступен. */
      status: 'unavailable'
    }

/**
 * Результат atomic cart transition.
 */
export type PersistedCartUpdateResult =
  | {
      /** Snapshot записан с новой revision. */
      status: 'updated'
      /** Authority snapshot после transition. */
      snapshot: PersistedCartSnapshot
    }

  | {
      /** Transform не изменил authority snapshot. */
      status: 'unchanged'
      /** Текущий authority snapshot. */
      snapshot: PersistedCartSnapshot
    }
  | {
      /** Expected revision больше не актуальна. */
      status: 'stale'
    }
  | {
      /** Repository transition не удалось подтвердить. */
      status: 'unavailable'
    }

/**
 * Результат проверки persisted cart revision.
 */
export type PersistedCartRevisionStatus = 'current' | 'stale' | 'unavailable'

/**
 * Проверяет persisted-снимок продукта перед восстановлением cart state.
 */
const isStoredProduct = (value: unknown): value is Product => {
  return (
    isRecord(value) &&
    hasOwn(value, 'id') && isString(value.id) &&
    hasOwn(value, 'name') && isString(value.name) &&
    hasOwn(value, 'slug') && isString(value.slug) &&
    hasOwn(value, 'description') && isString(value.description) &&
    hasOwn(value, 'priceCents') && isNumber(value.priceCents) &&
    hasOwn(value, 'currency') && isOneOf(value.currency, CURRENCIES) &&
    hasOwn(value, 'categoryId') && isString(value.categoryId) &&
    hasOwn(value, 'stock') && isNumber(value.stock) &&
    hasOwn(value, 'rating') && isNumber(value.rating) &&
    hasOwn(value, 'imageUrl') && isString(value.imageUrl) && isSupportedProductImageUrl(value.imageUrl) &&
    hasOwn(value, 'createdAt') && isString(value.createdAt) &&
    hasOwn(value, 'version') && isNumber(value.version)
  )
}

/**
 * Проверяет persisted-строку корзины.
 */
const isStoredCartLine = (value: unknown): value is CartLine => {
  return (
    isRecord(value) &&
    hasOwn(value, 'product') && isStoredProduct(value.product) &&
    hasOwn(value, 'quantity') && isNumber(value.quantity) &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    value.quantity <= getCartProductQuantityLimit(value.product)
  )
}

/**
 * Восстанавливает только полностью валидный persisted cart snapshot.
 */
export const hydrateCartLines = (value: unknown): CartLine[] => {
  return isArrayOf(value, isStoredCartLine) ? value : []
}

/**
 * Проверяет persisted snapshot envelope после чтения storage.
 */
const isPersistedCartSnapshot = (value: unknown): value is PersistedCartSnapshot => {
  return (
    isRecord(value) &&
    hasOwn(value, 'revision') &&
    isNumber(value.revision) &&
    Number.isInteger(value.revision) &&
    value.revision >= 1 &&
    hasOwn(value, 'lines') &&
    isArrayOf(value.lines, isStoredCartLine)
  )
}

/**
 * Читает snapshot и мигрирует legacy lines-array в memory representation.
 */
export const readPersistedCartSnapshot = (): PersistedCartReadResult => {
  const result = readJsonStorageResult(CART_STORAGE_KEY)

  if (result.status === 'unavailable' || result.status === 'invalid') {
    return { status: 'unavailable' }
  }

  if (result.status === 'missing') {
    return { status: 'ready', snapshot: null, shouldCommit: true }
  }

  if (isPersistedCartSnapshot(result.value)) {
    return { status: 'ready', snapshot: result.value, shouldCommit: false }
  }

  return {
    status: 'ready',
    snapshot: {
      revision: createCartRevision(),
      lines: hydrateCartLines(result.value)
    },
    shouldCommit: true
  }
}

/**
 * Создаёт или мигрирует persisted cart snapshot под cross-tab lock.
 */
export const initializePersistedCartSnapshot = async (): Promise<PersistedCartSnapshot | null> => {
  try {
    return await withBrowserStorageLock(CART_STORAGE_LOCK, () => {
      const result = readPersistedCartSnapshot()

      if (result.status === 'unavailable') {
        return null
      }

      const snapshot = result.snapshot ?? { revision: createCartRevision(), lines: [] }

      if (result.shouldCommit && !writeJsonStorage(CART_STORAGE_KEY, snapshot)) {
        return null
      }

      return snapshot
    })
  } catch {
    return null
  }
}

/**
 * Перезаписывает unreadable cart безопасным пустым snapshot по явному действию пользователя.
 */
export const resetPersistedCartSnapshot = async (
  minimumRevision = 0
): Promise<PersistedCartSnapshot | null> => {
  try {
    return await withBrowserStorageLock(CART_STORAGE_LOCK, () => {
      const snapshot: PersistedCartSnapshot = {
        revision: createCartRevision(minimumRevision),
        lines: []
      }

      return writeJsonStorage(CART_STORAGE_KEY, snapshot) ? snapshot : null
    })
  } catch {
    return null
  }
}

/**
 * Применяет transform к последнему persisted snapshot под cross-tab lock.
 */
export const updatePersistedCartSnapshot = async (
  transform: (lines: CartLine[]) => CartLine[] | null,
  expectedRevision?: number
): Promise<PersistedCartUpdateResult> => {
  try {
    return await withBrowserStorageLock(CART_STORAGE_LOCK, () => {
      const result = readPersistedCartSnapshot()

      if (result.status === 'unavailable') {
        return { status: 'unavailable' }
      }

      const currentSnapshot = result.snapshot ?? {
        revision: createCartRevision(),
        lines: []
      }

      if (
        expectedRevision !== undefined &&
        currentSnapshot.revision !== expectedRevision
      ) {
        return { status: 'stale' }
      }

      const nextLines = transform(currentSnapshot.lines)

      if (nextLines === null || nextLines === currentSnapshot.lines) {
        return { status: 'unchanged', snapshot: currentSnapshot }
      }

      const nextSnapshot: PersistedCartSnapshot = {
        revision: createCartRevision(currentSnapshot.revision),
        lines: nextLines
      }

      if (!writeJsonStorage(CART_STORAGE_KEY, nextSnapshot)) {
        return { status: 'unavailable' }
      }

      return { status: 'updated', snapshot: nextSnapshot }
    })
  } catch {
    return { status: 'unavailable' }
  }
}

/**
 * Сверяет expected revision с persisted authority под тем же lock.
 */
export const isPersistedCartRevisionCurrent = async (
  expectedRevision: number
): Promise<PersistedCartRevisionStatus> => {
  try {
    return await withBrowserStorageLock(CART_STORAGE_LOCK, () => {
      const result = readPersistedCartSnapshot()

      if (result.status === 'unavailable') {
        return 'unavailable'
      }

      return result.snapshot?.revision === expectedRevision ? 'current' : 'stale'
    })
  } catch {
    return 'unavailable'
  }
}

/**
 * Подписывает cart owner на committed snapshots других вкладок.
 */
export const subscribePersistedCartSnapshot = (
  listener: (result: PersistedCartReadResult) => void
): (() => void) => {
  /**
   * Читает committed snapshot после cross-tab storage event.
   */
  const handleStorage = (event: StorageEvent): void => {
    if (event.key === CART_STORAGE_KEY) {
      listener(readPersistedCartSnapshot())
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => window.removeEventListener('storage', handleStorage)
}
