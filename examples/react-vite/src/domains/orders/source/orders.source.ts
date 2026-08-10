import { simpleRestApi } from 'infra/simple-rest-api'
import { OrderError } from '../errors/order.error'
import type { DraftOrderItem } from '../types/draft-order.type'
import type { Order } from '../types/order.type'
import { mapOrderError } from './map-order-error'
import { orderResponseSchema } from './order.schemas'

/**
 * Проверяет wire response одиночного заказа.
 */
const parseOrderResponse = (response: unknown): Order => {
  const parsedResponse = orderResponseSchema.safeParse(response)

  if (!parsedResponse.success) {
    throw new OrderError('invalid-data', 'Simple API вернул заказ неизвестного формата.')
  }

  return parsedResponse.data.data
}

/**
 * Создаёт заказ из зафиксированных строк draft order.
 */
export const createOrder = async (items: DraftOrderItem[]): Promise<Order> => {
  const body = {
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      expectedVersion: item.expectedVersion,
      expectedUnitPriceCents: item.unitPriceCents
    }))
  }

  try {
    const response = await simpleRestApi.orders.simpleOrdersCreate(body)
    return parseOrderResponse(response)
  } catch (error) {
    throw mapOrderError(error)
  }
}

/**
 * Отменяет доступный пользователю заказ.
 */
export const cancelOrder = async (orderId: string): Promise<Order> => {
  try {
    const response = await simpleRestApi.orders.simpleOrdersCancel({ id: orderId })
    return parseOrderResponse(response)
  } catch (error) {
    throw mapOrderError(error)
  }
}
