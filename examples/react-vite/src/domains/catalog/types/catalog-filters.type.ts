/** Порядок сортировки продуктов. */
export type CatalogSort = 'newest' | 'price-asc' | 'price-desc' | 'name'

/**
 * Фильтры страницы каталога.
 */
export type CatalogFilters = {
  /** Номер текущей страницы. */
  page: number
  /** Максимальное число продуктов на странице. */
  limit: number
  /** Поисковая строка. */
  search?: string
  /** Выбранная категория. */
  categoryId?: string
  /** Порядок выдачи. */
  sort: CatalogSort
}
