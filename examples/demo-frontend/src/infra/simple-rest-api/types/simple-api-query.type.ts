import type { SortEnum } from '../generated'

/**
 * Query-параметры выдачи продуктов с исправленными числовыми полями OpenAPI.
 */
export type SimpleProductsQuery = {
  /** Номер страницы, начиная с единицы. */
  page?: number
  /** Максимальное число продуктов на странице. */
  limit?: number
  /** Поиск по названию и описанию. */
  search?: string
  /** Фильтр по идентификатору категории. */
  categoryId?: string
  /** Порядок сортировки выдачи. */
  sort?: SortEnum
}

/**
 * Query-параметры списка заказов с исправленными числовыми полями OpenAPI.
 */
export type SimpleOrdersQuery = {
  /** Номер страницы, начиная с единицы. */
  page?: number
  /** Максимальное число заказов на странице. */
  limit?: number
}
