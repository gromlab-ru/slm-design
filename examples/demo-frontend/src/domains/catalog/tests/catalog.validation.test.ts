import { describe, expect, it } from 'vitest'

import { validateProductInput } from '../catalog.validation'
import type { CreateProductInput } from '../types/catalog-command.type'

const INPUT: CreateProductInput = {
  name: 'Safe object',
  description: 'A deterministic object with an allowed remote image.',
  priceCents: 9900,
  currency: 'USD',
  categoryId: 'category-electronics',
  stock: 10,
  imageUrl: 'https://picsum.photos/seed/safe-object/640/480'
}

describe('catalog product validation', () => {
  it('accepts the configured image host', () => {
    expect(validateProductInput(INPUT)).toBeNull()
  })

  it('rejects URLs that Next Image cannot render', () => {
    expect(
      validateProductInput({ ...INPUT, imageUrl: 'https://example.com/object.jpg' })?.code
    ).toBe('validation')
    expect(
      validateProductInput({ ...INPUT, imageUrl: 'http://picsum.photos/seed/object/640/480' })?.code
    ).toBe('validation')
  })
})
