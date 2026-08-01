import type { CatalogError } from './catalog-error.type'
import type { CatalogPagination, Category, Product } from './catalog-model.type'

/**
 * Состояние фильтрованной выдачи продуктов.
 */
export type ProductCatalogState = {
  /** Продукты текущей страницы. */
  products: Product[]
  /** Метаданные pagination, когда ответ получен. */
  pagination: CatalogPagination | null
  /** Признак первого запроса без данных. */
  isLoading: boolean
  /** Признак фоновой ревалидации. */
  isRefreshing: boolean
  /** Ожидаемая ошибка каталога. */
  error: CatalogError | null
  /** Повторяет текущий запрос. */
  reload: () => Promise<void>
}

/**
 * Состояние справочника категорий.
 */
export type CategoriesState = {
  /** Доступные категории. */
  categories: Category[]
  /** Признак первого запроса без данных. */
  isLoading: boolean
  /** Ожидаемая ошибка каталога. */
  error: CatalogError | null
  /** Повторяет запрос категорий. */
  reload: () => Promise<void>
}

/**
 * Состояние детальной карточки продукта.
 */
export type ProductState = {
  /** Продукт после успешной загрузки. */
  product: Product | null
  /** Признак первого запроса без данных. */
  isLoading: boolean
  /** Ожидаемая ошибка каталога. */
  error: CatalogError | null
  /** Повторяет detail-запрос. */
  reload: () => Promise<void>
}
