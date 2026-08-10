/**
 * Минимальный product snapshot, принимаемый владельцем draft order.
 */
export type DraftOrderProduct = {
  /** Идентификатор продукта. */
  id: string
  /** Название продукта. */
  name: string
  /** Цена в минимальных единицах. */
  priceCents: number
  /** Валюта продукта. */
  currency: 'USD' | 'EUR'
  /** Версия product snapshot. */
  version: number
  /** Доступный остаток. */
  stock: number
  /** URL изображения. */
  imageUrl: string
}

/**
 * Строка draft order до checkout.
 */
export type DraftOrderItem = {
  /** Идентификатор продукта. */
  productId: string
  /** Название продукта. */
  productName: string
  /** Выбранное количество. */
  quantity: number
  /** Цена из product snapshot. */
  unitPriceCents: number
  /** Валюта продукта. */
  currency: 'USD'
  /** Версия из product snapshot. */
  expectedVersion: number
  /** Остаток, ограничивающий количество. */
  availableStock: number
  /** URL изображения продукта. */
  imageUrl: string
}
