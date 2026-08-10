import type { DraftOrderItem, DraftOrderProduct } from './draft-order.type'
import type { Order } from './order.type'

/**
 * Публичные возможности draft order и checkout.
 */
export type OrdersContextValue = {
  /** Текущие строки draft order. */
  items: DraftOrderItem[]
  /** Общее количество единиц в draft order. */
  itemCount: number
  /** Итоговая стоимость draft order в USD cents. */
  totalCents: number
  /** Последнее пользовательское сообщение checkout. */
  notice: string | null
  /** Последний успешно созданный заказ. */
  createdOrder: Order | null
  /** Выполняется ли checkout. */
  isCheckingOut: boolean
  /** Добавляет актуальный product snapshot в draft order. */
  addProduct: (product: DraftOrderProduct) => void
  /** Изменяет количество строки с учётом stock и API-лимита. */
  setQuantity: (productId: string, quantity: number) => void
  /** Удаляет продукт из draft order. */
  removeProduct: (productId: string) => void
  /** Очищает draft order. */
  clearDraft: () => void
  /** Проверяет snapshot на backend и создаёт заказ. */
  checkout: () => Promise<void>
}
