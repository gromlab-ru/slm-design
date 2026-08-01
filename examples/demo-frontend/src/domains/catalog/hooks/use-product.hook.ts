'use client'

import { useGetProduct } from '@/infra/simple-rest-api'

import { mapCatalogError } from '../errors/catalog-error.mapper'
import { mapProduct } from '../mappers/catalog.mapper'
import type { ProductState } from '../types/catalog-state.type'

/**
 * Получает один продукт по route-параметру.
 */
export const useProduct = (productId: string): ProductState => {
  const query = useGetProduct(productId ? { id: productId } : null)

  return {
    product: query.data ? mapProduct(query.data.data) : null,
    isLoading: query.isLoading,
    error: query.error ? mapCatalogError(query.error) : null,
    reload: async () => {
      await query.mutate()
    }
  }
}
