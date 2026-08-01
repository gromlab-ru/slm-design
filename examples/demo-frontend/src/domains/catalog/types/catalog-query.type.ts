/**
 * Поддерживаемая сортировка каталога.
 */
export type CatalogSort = 'newest' | 'price-asc' | 'price-desc' | 'name'

/**
 * Фильтры публичной выдачи каталога.
 */
export type CatalogFilters = {
  /** Номер страницы. */
  page: number
  /** Число карточек на странице. */
  limit: number
  /** Поисковая строка. */
  search: string
  /** Выбранная категория или пустая строка. */
  categoryId: string
  /** Активная сортировка. */
  sort: CatalogSort
}
