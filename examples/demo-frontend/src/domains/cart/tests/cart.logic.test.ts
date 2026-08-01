import { describe, expect, it } from 'vitest'

import type { Product } from '@/domains/catalog'

import {
  addCartProduct,
  calculateCartTotals,
  reconcileCartProducts,
  setCartProductQuantity
} from '../cart.logic'

const PRODUCT: Product = {
  id: 'product-test',
  name: 'Test object',
  slug: 'test-object',
  description: 'A deterministic product for cart owner tests.',
  priceCents: 2500,
  currency: 'USD',
  categoryId: 'category-test',
  stock: 2,
  rating: 4.5,
  imageUrl: 'https://picsum.photos/seed/test/640/480',
  createdAt: '2026-07-20T10:00:00.000Z',
  version: 1
}

describe('cart domain logic', () => {
  it('caps quantity at the current product stock', () => {
    const once = addCartProduct([], PRODUCT)
    const twice = addCartProduct(once, PRODUCT)
    const threeAttempts = addCartProduct(twice, PRODUCT)

    expect(threeAttempts).toEqual([{ product: PRODUCT, quantity: 2 }])
  })

  it('caps high-stock products at the order line contract limit', () => {
    const highStockProduct = { ...PRODUCT, stock: 100 }
    const lines = addCartProduct([], highStockProduct)

    expect(setCartProductQuantity(lines, highStockProduct.id, 21)).toEqual([
      { product: highStockProduct, quantity: 20 }
    ])
  })

  it('removes a line when quantity becomes zero', () => {
    const lines = addCartProduct([], PRODUCT)

    expect(setCartProductQuantity(lines, PRODUCT.id, 0)).toEqual([])
  })

  it('rejects checkout for mixed currencies while retaining item totals', () => {
    const eurProduct: Product = { ...PRODUCT, id: 'product-eur', currency: 'EUR' }
    const totals = calculateCartTotals([
      { product: PRODUCT, quantity: 1 },
      { product: eurProduct, quantity: 1 }
    ])

    expect(totals).toEqual({
      itemCount: 2,
      subtotalCents: 5000,
      currency: null
    })
  })

  it('reconciles a stale price and version before checkout', () => {
    const lines = [{ product: PRODUCT, quantity: 1 }]
    const latestProduct = { ...PRODUCT, priceCents: 3100, version: 2 }

    expect(reconcileCartProducts(lines, [latestProduct])).toEqual({
      lines: [{ product: latestProduct, quantity: 1 }],
      hasChanges: true
    })
  })
})
