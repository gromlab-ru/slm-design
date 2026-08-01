import type { SimpleOrderDto } from '@/infra/simple-rest-api'

import type { Order } from '../types/order.type'

/**
 * Переводит order DTO в модель orders-домена.
 */
export const mapOrder = (order: SimpleOrderDto): Order => {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    lines: order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents
    })),
    totalCents: order.totalCents,
    currency: order.currency,
    createdAt: order.createdAt
  }
}
