import type { SimpleCategoryDto, SimpleProductDto } from '@/infra/simple-rest-api'

import type { Category, Product } from '../types/catalog-model.type'
import { normalizeProductImageUrl } from '../catalog.validation'

/**
 * Переводит product DTO в модель catalog-домена.
 */
export const mapProduct = (product: SimpleProductDto): Product => {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    priceCents: product.priceCents,
    currency: product.currency,
    categoryId: product.categoryId,
    stock: product.stock,
    rating: product.rating,
    imageUrl: normalizeProductImageUrl(product.imageUrl),
    createdAt: product.createdAt,
    version: product.version
  }
}

/**
 * Переводит category DTO в модель catalog-домена.
 */
export const mapCategory = (category: SimpleCategoryDto): Category => {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    productCount: category.productCount
  }
}
