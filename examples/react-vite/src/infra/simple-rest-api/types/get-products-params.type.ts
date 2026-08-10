import type { SortEnum } from '../generated'

/**
 * Исправленные параметры списка продуктов.
 *
 * OpenAPI backend ошибочно описывает page и limit через пустой Object schema.
 */
export type GetProductsParams = {
  /** Номер страницы, начиная с единицы. */
  page?: number
  /** Число продуктов на странице. */
  limit?: number
  /** Поиск по имени и описанию. */
  search?: string
  /** Фильтр по идентификатору категории. */
  categoryId?: string
  /** Порядок сортировки каталога. */
  sort?: SortEnum
}
