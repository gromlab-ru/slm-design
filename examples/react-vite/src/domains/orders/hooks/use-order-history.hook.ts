import { useGetOrderList } from 'infra/simple-rest-api'
import { OrderError } from '../errors/order.error'
import { mapOrderError } from '../source/map-order-error'
import { orderPageSchema } from '../source/order.schemas'
import type { OrderPage } from '../types/order-page.type'

/**
 * Результат чтения истории заказов.
 */
export type OrderHistoryQuery = {
  /** Валидированная страница заказов или null до ответа. */
  page: OrderPage | null
  /** Выполняется ли первый запрос. */
  isLoading: boolean
  /** Ожидаемая ошибка чтения или null. */
  error: OrderError | null
  /** Повторно получает текущую страницу. */
  refresh: () => Promise<void>
}

/**
 * Проверяет wire response истории заказов.
 */
const parseOrderPage = (response: unknown): OrderPage => {
  const parsedResponse = orderPageSchema.safeParse(response)

  if (!parsedResponse.success) {
    throw new OrderError('invalid-data', 'Simple API вернул историю неизвестного формата.')
  }

  return {
    orders: parsedResponse.data.data,
    ...parsedResponse.data.meta
  }
}

/**
 * Повторно запускает GET текущей страницы заказов.
 */
const refreshOrderQuery = async (mutateOrders: () => Promise<unknown>): Promise<void> => {
  await mutateOrders()
}

/**
 * Предоставляет domain UI валидированную историю заказов.
 */
export const useOrderHistory = (): OrderHistoryQuery => {
  const orderQuery = useGetOrderList({ page: 1, limit: 20 })
  let page: OrderPage | null = null
  let error: OrderError | null = null

  try {
    if (orderQuery.data) {
      page = parseOrderPage(orderQuery.data)
    }
  } catch (parseError) {
    error = mapOrderError(parseError)
  }

  if (orderQuery.error) {
    error = mapOrderError(orderQuery.error)
  }

  /**
   * Обновляет историю после checkout или cancel mutation.
   */
  const refresh = async (): Promise<void> => {
    await refreshOrderQuery(orderQuery.mutate)
  }

  return {
    page,
    isLoading: !orderQuery.data && !orderQuery.error,
    error,
    refresh
  }
}
