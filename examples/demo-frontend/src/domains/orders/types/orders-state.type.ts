import type { OrderError } from './order-error.type'
import type { Order } from './order.type'

/**
 * Состояние доступной пользователю истории заказов.
 */
export type OrdersState = {
  /** Заказы текущей страницы. */
  orders: Order[]
  /** Признак первого защищённого запроса. */
  isLoading: boolean
  /** Ожидаемая ошибка orders-домена. */
  error: OrderError | null
  /** Повторяет запрос истории. */
  reload: () => Promise<void>
}
