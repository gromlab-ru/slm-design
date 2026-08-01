import type { CatalogCurrency, Product } from './catalog-model.type'
import type { CatalogError } from './catalog-error.type'
import type { Result } from '@/shared/types/result.type'

/**
 * Поля нового продукта, доступные администратору.
 */
export type CreateProductInput = {
  /** Название продукта. */
  name: string
  /** Полное описание продукта. */
  description: string
  /** Цена в минимальных единицах. */
  priceCents: number
  /** Валюта цены. */
  currency: CatalogCurrency
  /** Идентификатор существующей категории. */
  categoryId: string
  /** Начальный остаток. */
  stock: number
  /** URL изображения. */
  imageUrl: string
}

/**
 * Изменение продукта с optimistic-lock версией.
 */
export type UpdateProductInput = Partial<CreateProductInput> & {
  /** Идентификатор изменяемого продукта. */
  id: string
  /** Последняя прочитанная версия. */
  version: number
}

/**
 * Результат удаления продукта.
 */
export type RemovedProduct = Pick<Product, 'id'>

/**
 * Public mutation/read-through commands catalog-домена.
 */
export type CatalogCommands = {
  /** Создаёт продукт в captured admin session. */
  createProduct: (
    input: CreateProductInput,
    sessionKey: string
  ) => Promise<Result<Product, CatalogError>>
  /** Сохраняет optimistic-lock изменение в captured admin session. */
  updateProduct: (
    input: UpdateProductInput,
    sessionKey: string
  ) => Promise<Result<Product, CatalogError>>
  /** Удаляет продукт в captured admin session. */
  removeProduct: (
    productId: string,
    sessionKey: string
  ) => Promise<Result<RemovedProduct, CatalogError>>
  /** Загружает authority snapshots для checkout reconciliation. */
  loadProducts: (productIds: string[]) => Promise<Result<Product[], CatalogError>>
}
