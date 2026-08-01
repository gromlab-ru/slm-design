import { describe, expect, it } from 'vitest'

import { canCancelOrder, validateOrderDraft } from '../order.rules'
import type { Order, OrderDraftLine } from '../types/order.type'

const VALID_LINE: OrderDraftLine = {
  productId: 'product-keyboard',
  quantity: 1,
  availableStock: 24,
  currency: 'USD',
  expectedVersion: 1,
  expectedUnitPriceCents: 12990
}

const ORDER: Order = {
  id: 'order-001',
  userId: 'user-customer',
  status: 'pending',
  lines: [],
  totalCents: 12990,
  currency: 'USD',
  createdAt: '2026-07-20T10:00:00.000Z'
}

describe('orders domain rules', () => {
  it('accepts a supported draft and rejects quantity above backend limit', () => {
    expect(validateOrderDraft([VALID_LINE])).toBeNull()
    expect(validateOrderDraft([{ ...VALID_LINE, quantity: 21 }])?.code).toBe('invalid-quantity')
  })

  it('owns the USD checkout constraint', () => {
    expect(validateOrderDraft([{ ...VALID_LINE, currency: 'EUR' }])?.code).toBe(
      'unsupported-currency'
    )
  })

  it('publishes cancel capabilities from order status', () => {
    expect(canCancelOrder(ORDER)).toBe(true)
    expect(canCancelOrder({ ...ORDER, status: 'shipped' })).toBe(false)
    expect(canCancelOrder({ ...ORDER, status: 'cancelled' })).toBe(false)
  })
})
