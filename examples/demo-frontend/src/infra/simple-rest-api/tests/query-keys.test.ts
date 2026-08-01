import { describe, expect, it } from 'vitest'

import { getOrdersKey } from '../hooks/use-get-orders.hook'
import { getProductKey } from '../hooks/use-get-product.hook'
import { getProductsKey } from '../hooks/use-get-products.hook'

describe('Simple REST API SWR keys', () => {
  it('matches the actual filtered products endpoint', () => {
    expect(
      getProductsKey({
        page: 2,
        limit: 12,
        search: 'desk lamp',
        categoryId: 'category-home',
        sort: 'price-asc'
      })
    ).toEqual([
      'simple-rest-api',
      '/api/v1/products?page=2&limit=12&search=desk+lamp&categoryId=category-home&sort=price-asc'
    ])
  })

  it('blocks protected and detail requests until required input is ready', () => {
    expect(getOrdersKey(null)).toBeNull()
    expect(getProductKey(null)).toBeNull()
  })
})
