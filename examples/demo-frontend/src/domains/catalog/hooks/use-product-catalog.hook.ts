'use client'

import { useGetProducts } from '@/infra/simple-rest-api'

import { mapCatalogError } from '../errors/catalog-error.mapper'
import { mapProduct } from '../mappers/catalog.mapper'
import type { CatalogFilters } from '../types/catalog-query.type'
import type { ProductCatalogState } from '../types/catalog-state.type'

/**
 * Получает фильтрованную выдачу и публикует только catalog-модели.
 */
export const useProductCatalog = (filters: CatalogFilters): ProductCatalogState => {
  const query = useGetProducts({
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    categoryId: filters.categoryId || undefined,
    sort: filters.sort
  })
  const products = query.data?.data.map(mapProduct) ?? []
  const meta = query.data?.meta
  const pagination = meta
    ? {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: meta.totalPages
      }
    : null

  return {
    products,
    pagination,
    isLoading: query.isLoading,
    isRefreshing: query.isValidating && query.data !== undefined,
    error: query.error ? mapCatalogError(query.error) : null,
    reload: async () => {
      await query.mutate()
    }
  }
}
