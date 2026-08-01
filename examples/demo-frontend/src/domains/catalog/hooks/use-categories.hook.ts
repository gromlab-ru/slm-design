'use client'

import { useGetCategories } from '@/infra/simple-rest-api'

import { mapCatalogError } from '../errors/catalog-error.mapper'
import { mapCategory } from '../mappers/catalog.mapper'
import type { CategoriesState } from '../types/catalog-state.type'

/**
 * Получает справочник категорий для фильтров и admin-форм.
 */
export const useCategories = (): CategoriesState => {
  const query = useGetCategories()

  return {
    categories: query.data?.data.map(mapCategory) ?? [],
    isLoading: query.isLoading,
    error: query.error ? mapCatalogError(query.error) : null,
    reload: async () => {
      await query.mutate()
    }
  }
}
