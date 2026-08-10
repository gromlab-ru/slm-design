/** Статус заказа Simple Store. */
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled'

/** Валюта заказа. */
export type OrderCurrency = 'USD' | 'EUR'

/**
 * Зафиксированная строка оформленного заказа.
 */
export type OrderItem = {
  /** Идентификатор купленного продукта. */
  productId: string
  /** Название продукта на момент оформления. */
  productName: string
  /** Купленное количество. */
  quantity: number
  /** Цена единицы на момент оформления. */
  unitPriceCents: number
}

/**
 * Заказ, доступный текущему пользователю.
 */
export type Order = {
  /** Стабильный идентификатор заказа. */
  id: string
  /** Идентификатор владельца заказа. */
  userId: string
  /** Текущее состояние заказа. */
  status: OrderStatus
  /** Зафиксированные строки заказа. */
  items: OrderItem[]
  /** Итоговая стоимость в минимальных единицах. */
  totalCents: number
  /** Валюта всего заказа. */
  currency: OrderCurrency
  /** ISO-дата оформления. */
  createdAt: string
}
