import {
  useGetCategoryList,
  useGetProductList
} from 'infra/simple-rest-api'
import { CatalogError } from '../errors/catalog.error'
import type { CatalogCategory } from '../types/catalog-category.type'
import type { CatalogFilters } from '../types/catalog-filters.type'
import type { CatalogPage } from '../types/catalog-page.type'
import { mapCatalogError } from '../source/map-catalog-error'
import {
  catalogCategoriesSchema,
  catalogPageSchema
} from '../source/catalog.schemas'

/**
 * Результат чтения каталога для domain UI.
 */
export type CatalogQuery = {
  /** Валидированная страница продуктов или null до первого ответа. */
  page: CatalogPage | null
  /** Валидированные категории. */
  categories: CatalogCategory[]
  /** Выполняется ли первый запрос. */
  isLoading: boolean
  /** Ожидаемая ошибка чтения или null. */
  error: CatalogError | null
  /** Повторно получает продукты и категории. */
  refresh: () => Promise<void>
}

/**
 * Проверяет product response и отделяет wire envelope от доменной страницы.
 */
const parseCatalogPage = (response: unknown): CatalogPage => {
  const parsedResponse = catalogPageSchema.safeParse(response)

  if (!parsedResponse.success) {
    throw new CatalogError('invalid-data', 'Simple API вернул каталог неизвестного формата.')
  }

  return {
    products: parsedResponse.data.data,
    ...parsedResponse.data.meta
  }
}

/**
 * Проверяет category response до передачи данных domain UI.
 */
const parseCategories = (response: unknown): CatalogCategory[] => {
  const parsedResponse = catalogCategoriesSchema.safeParse(response)

  if (!parsedResponse.success) {
    throw new CatalogError('invalid-data', 'Simple API вернул категории неизвестного формата.')
  }

  return parsedResponse.data.data
}

/**
 * Повторно запускает оба GET-запроса каталога.
 */
const refreshCatalogQueries = async (
  mutateProducts: () => Promise<unknown>,
  mutateCategories: () => Promise<unknown>
): Promise<void> => {
  await Promise.all([mutateProducts(), mutateCategories()])
}

/**
 * Предоставляет domain UI валидированные продукты, категории и pagination.
 */
export const useCatalog = (filters: CatalogFilters): CatalogQuery => {
  const productQuery = useGetProductList(filters)
  const categoryQuery = useGetCategoryList()
  let page: CatalogPage | null = null
  let categories: CatalogCategory[] = []
  let error: CatalogError | null = null

  try {
    if (productQuery.data) {
      page = parseCatalogPage(productQuery.data)
    }

    if (categoryQuery.data) {
      categories = parseCategories(categoryQuery.data)
    }
  } catch (parseError) {
    error = mapCatalogError(parseError)
  }

  const queryError = productQuery.error ?? categoryQuery.error

  if (queryError) {
    error = mapCatalogError(queryError)
  }

  /**
   * Обновляет все source-данные каталога после mutation.
   */
  const refresh = async (): Promise<void> => {
    await refreshCatalogQueries(productQuery.mutate, categoryQuery.mutate)
  }

  return {
    page,
    categories,
    isLoading: !productQuery.data && !productQuery.error,
    error,
    refresh
  }
}
