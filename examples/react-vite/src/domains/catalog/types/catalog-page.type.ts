import type { CatalogProduct } from './catalog-product.type'

/**
 * Страница продуктов и её pagination metadata.
 */
export type CatalogPage = {
  /** Продукты текущей страницы. */
  products: CatalogProduct[]
  /** Номер текущей страницы. */
  page: number
  /** Лимит элементов страницы. */
  limit: number
  /** Общее число продуктов после фильтрации. */
  total: number
  /** Общее число страниц. */
  totalPages: number
}
