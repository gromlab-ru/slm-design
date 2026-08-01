/**
 * Состояние заказа Simple storefront.
 */
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled'

/**
 * Одна строка созданного заказа.
 */
export type OrderLine = {
  /** Идентификатор продукта. */
  productId: string
  /** Название продукта на момент заказа. */
  productName: string
  /** Заказанное количество. */
  quantity: number
  /** Цена единицы в минимальных единицах. */
  unitPriceCents: number
}

/**
 * Заказ текущего пользователя или видимый администратору заказ.
 */
export type Order = {
  /** Стабильный идентификатор. */
  id: string
  /** Идентификатор владельца. */
  userId: string
  /** Текущее состояние. */
  status: OrderStatus
  /** Зафиксированные строки. */
  lines: OrderLine[]
  /** Итог в минимальных единицах. */
  totalCents: number
  /** Валюта итога. */
  currency: 'USD' | 'EUR'
  /** ISO-дата создания. */
  createdAt: string
}

/**
 * Domain draft line checkout-сценария.
 */
export type OrderDraftLine = {
  /** Идентификатор продукта. */
  productId: string
  /** Запрошенное количество. */
  quantity: number
  /** Последний известный stock для preflight validation. */
  availableStock: number
  /** Валюта authority snapshot. */
  currency: 'USD' | 'EUR'
  /** Версия product snapshot, подтверждённая пользователем. */
  expectedVersion: number
  /** Цена product snapshot, подтверждённая пользователем. */
  expectedUnitPriceCents: number
}
