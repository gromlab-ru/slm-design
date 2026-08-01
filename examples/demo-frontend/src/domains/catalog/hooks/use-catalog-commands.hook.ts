'use client'

import {
  createSimpleAuthSessionRequest,
  simpleRestApi,
  useSimpleRestApiCache
} from '@/infra/simple-rest-api'

import { mapCatalogError } from '../errors/catalog-error.mapper'
import { mapProduct } from '../mappers/catalog.mapper'
import { validateProductInput } from '../catalog.validation'
import type { CatalogCommands } from '../types/catalog-command.type'

/**
 * Возвращает catalog commands, привязанные к текущему REST cache scope.
 */
export const useCatalogCommands = (): CatalogCommands => {
  const cache = useSimpleRestApiCache()

  /**
   * Создаёт продукт с domain validation и backend RBAC.
   */
  const createProduct: CatalogCommands['createProduct'] = async (input, sessionKey) => {
    const validationError = validateProductInput(input)

    if (validationError !== null) {
      return { isSuccess: false, error: validationError }
    }

    try {
      const response = await simpleRestApi.products.simpleProductsCreate(
        input,
        createSimpleAuthSessionRequest(sessionKey)
      )
      const product = mapProduct(response.data)

      await cache.invalidateCatalog()

      return { isSuccess: true, data: product }
    } catch (error) {
      return { isSuccess: false, error: mapCatalogError(error) }
    }
  }

  /**
   * Сохраняет продукт с optimistic-lock версией последнего чтения.
   */
  const updateProduct: CatalogCommands['updateProduct'] = async (input, sessionKey) => {
    const validationError = validateProductInput(input)

    if (validationError !== null) {
      return { isSuccess: false, error: validationError }
    }

    const { id, ...changes } = input

    try {
      const response = await simpleRestApi.products.simpleProductsUpdate(
        { id },
        changes,
        createSimpleAuthSessionRequest(sessionKey)
      )
      const product = mapProduct(response.data)

      await cache.invalidateCatalog()

      return { isSuccess: true, data: product }
    } catch (error) {
      return { isSuccess: false, error: mapCatalogError(error) }
    }
  }

  /**
   * Удаляет продукт и ревалидирует только catalog resources.
   */
  const removeProduct: CatalogCommands['removeProduct'] = async (productId, sessionKey) => {
    try {
      await simpleRestApi.products.simpleProductsRemove(
        { id: productId },
        createSimpleAuthSessionRequest(sessionKey)
      )
      await cache.invalidateCatalog()

      return { isSuccess: true, data: { id: productId } }
    } catch (error) {
      return { isSuccess: false, error: mapCatalogError(error) }
    }
  }

  /**
   * Загружает свежие product snapshots перед checkout или conflict recovery.
   */
  const loadProducts: CatalogCommands['loadProducts'] = async (productIds) => {
    const uniqueProductIds = [...new Set(productIds)]

    try {
      const responses = await Promise.all(
        uniqueProductIds.map((productId) =>
          simpleRestApi.products.simpleProductsGet({ id: productId })
        )
      )

      return {
        isSuccess: true,
        data: responses.map((response) => mapProduct(response.data))
      }
    } catch (error) {
      return { isSuccess: false, error: mapCatalogError(error) }
    }
  }

  return { createProduct, updateProduct, removeProduct, loadProducts }
}
