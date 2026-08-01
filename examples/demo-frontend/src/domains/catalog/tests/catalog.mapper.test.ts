import { describe, expect, it } from 'vitest'

import type { SimpleProductDto } from '@/infra/simple-rest-api'

import { mapProduct } from '../mappers/catalog.mapper'
import { PRODUCT_IMAGE_PLACEHOLDER } from '../catalog.validation'

const PRODUCT_DTO: SimpleProductDto = {
  id: 'product-keyboard',
  name: 'Mechanical Keyboard',
  slug: 'mechanical-keyboard',
  description: 'A deterministic keyboard.',
  priceCents: 12990,
  currency: 'USD',
  categoryId: 'category-electronics',
  stock: 24,
  rating: 4.8,
  imageUrl: 'https://picsum.photos/seed/keyboard/640/480',
  createdAt: '2026-07-20T10:00:00.000Z',
  version: 3
}

describe('catalog DTO mapping', () => {
  it('creates a domain product without retaining the DTO object', () => {
    const product = mapProduct(PRODUCT_DTO)

    expect(product).not.toBe(PRODUCT_DTO)
    expect(product).toMatchObject({
      id: 'product-keyboard',
      priceCents: 12990,
      version: 3
    })
  })

  it('replaces an unsupported remote image before it reaches Next Image', () => {
    const product = mapProduct({
      ...PRODUCT_DTO,
      imageUrl: 'https://example.com/untrusted.png'
    })

    expect(product.imageUrl).toBe(PRODUCT_IMAGE_PLACEHOLDER)
  })
})
