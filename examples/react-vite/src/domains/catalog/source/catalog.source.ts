import {
  simpleRestApi,
  toSimpleRestApiError
} from 'infra/simple-rest-api'
import { CatalogError } from '../errors/catalog.error'
import type {
  CatalogProduct,
  CreateCatalogProduct,
  UpdateCatalogProduct
} from '../types/catalog-product.type'
import { mapCatalogError } from './map-catalog-error'
import { catalogProductResponseSchema } from './catalog.schemas'

/**
 * Проверяет и адаптирует одиночный product response.
 */
const parseProductResponse = (response: unknown): CatalogProduct => {
  const parsedResponse = catalogProductResponseSchema.safeParse(response)

  if (!parsedResponse.success) {
    throw new CatalogError('invalid-data', 'Simple API вернул продукт неизвестного формата.')
  }

  return parsedResponse.data.data
}

/**
 * Создаёт продукт от имени администратора.
 */
export const createCatalogProduct = async (
  product: CreateCatalogProduct
): Promise<CatalogProduct> => {
  try {
    const response = await simpleRestApi.products.simpleProductsCreate(product)
    return parseProductResponse(response)
  } catch (error) {
    throw mapCatalogError(error)
  }
}

/**
 * Обновляет продукт с optimistic locking по последней прочитанной версии.
 */
export const updateCatalogProduct = async (
  productId: string,
  product: UpdateCatalogProduct
): Promise<CatalogProduct> => {
  try {
    const response = await simpleRestApi.products.simpleProductsUpdate(
      { id: productId },
      product
    )
    return parseProductResponse(response)
  } catch (error) {
    throw mapCatalogError(error)
  }
}

/**
 * Удаляет продукт от имени администратора.
 */
export const deleteCatalogProduct = async (productId: string): Promise<void> => {
  try {
    await simpleRestApi.products.simpleProductsRemove({ id: productId })
  } catch (error) {
    const apiError = toSimpleRestApiError(error)
    throw mapCatalogError(apiError)
  }
}
