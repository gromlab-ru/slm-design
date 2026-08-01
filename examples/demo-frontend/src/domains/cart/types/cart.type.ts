import type { CatalogCurrency, Product } from '@/domains/catalog'

/**
 * Одна продуктовая позиция корзины.
 */
export type CartLine = {
  /** Снимок продукта на момент добавления. */
  product: Product
  /** Количество единиц от 1 до backend-лимита 20. */
  quantity: number
}

/**
 * Рассчитанные итоги текущей корзины.
 */
export type CartTotals = {
  /** Суммарное число единиц. */
  itemCount: number
  /** Сумма в минимальных единицах при единой валюте. */
  subtotalCents: number
  /** Единая валюта либо null для смешанной корзины. */
  currency: CatalogCurrency | null
}

/**
 * Результат сверки cart snapshots с authority catalog.
 */
export type CartReconciliation = {
  /** Строки с актуальными product snapshots. */
  lines: CartLine[]
  /** Изменился ли price, currency, stock, version или доступность. */
  hasChanges: boolean
}

/**
 * Результат CAS-сверки checkout snapshot с authority catalog.
 */
export type CartReconciliationStatus = 'stale' | 'unavailable' | 'unchanged' | 'updated'

/**
 * Результат conditional cart clear после checkout или fixture transition.
 */
export type CartClearStatus = 'cleared' | 'stale' | 'unavailable'

/**
 * Результат persisted revision precondition.
 */
export type CartRevisionStatus = 'current' | 'stale' | 'unavailable'

/**
 * Recoverable failure persisted cart repository.
 */
export type CartError = {
  /** Стабильный код storage failure. */
  code: 'storage-unavailable'
  /** Сообщение для application-level feedback. */
  message: string
}

/**
 * Публичный API cart-домена в application scope.
 */
export type CartContextValue = CartTotals & {
  /** Позиции корзины. */
  lines: CartLine[]
  /** Завершено ли восстановление persisted-снимка. */
  isHydrated: boolean
  /** Revision текущего immutable cart snapshot. */
  revision: number
  /** Последний recoverable repository failure. */
  error: CartError | null
  /** Добавляет одну единицу продукта с учётом stock. */
  addProduct: (product: Product) => Promise<void>
  /** Изменяет количество или удаляет строку при нуле. */
  setQuantity: (productId: string, quantity: number) => Promise<void>
  /** Удаляет продукт из корзины. */
  removeProduct: (productId: string) => Promise<void>
  /** Заменяет snapshots только для ожидаемой cart revision. */
  reconcileProducts: (
    products: Product[],
    expectedRevision: number
  ) => Promise<CartReconciliationStatus>
  /** Проверяет, что async workflow всё ещё относится к cart snapshot. */
  isCurrentRevision: (revision: number) => Promise<CartRevisionStatus>
  /** Очищает корзину безусловно либо только для ожидаемой revision. */
  clearCart: (expectedRevision?: number) => Promise<CartClearStatus>
}
