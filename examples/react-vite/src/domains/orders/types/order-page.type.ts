import type { Order } from './order.type'

/**
 * Страница доступных пользователю заказов.
 */
export type OrderPage = {
  /** Заказы текущей страницы. */
  orders: Order[]
  /** Номер текущей страницы. */
  page: number
  /** Лимит страницы. */
  limit: number
  /** Общее число доступных заказов. */
  total: number
  /** Общее число страниц. */
  totalPages: number
}
