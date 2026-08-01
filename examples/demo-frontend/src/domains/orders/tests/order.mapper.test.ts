import { describe, expect, it } from 'vitest'

import type { SimpleOrderDto } from '@/infra/simple-rest-api'

import { mapOrder } from '../mappers/order.mapper'

describe('orders DTO mapping', () => {
  it('renames transport items to domain lines', () => {
    const dto: SimpleOrderDto = {
      id: 'order-001',
      userId: 'user-customer',
      status: 'paid',
      items: [
        {
          productId: 'product-keyboard',
          productName: 'Mechanical Keyboard',
          quantity: 1,
          unitPriceCents: 12990
        }
      ],
      totalCents: 12990,
      currency: 'USD',
      createdAt: '2026-07-20T10:00:00.000Z'
    }

    const order = mapOrder(dto)

    expect(order.lines).toEqual([
      {
        productId: 'product-keyboard',
        productName: 'Mechanical Keyboard',
        quantity: 1,
        unitPriceCents: 12990
      }
    ])
    expect('items' in order).toBe(false)
  })
})
