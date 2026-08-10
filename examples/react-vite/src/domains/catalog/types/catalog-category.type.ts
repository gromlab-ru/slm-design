/**
 * Категория продуктового каталога.
 */
export type CatalogCategory = {
  /** Стабильный идентификатор категории. */
  id: string
  /** Отображаемое название. */
  name: string
  /** URL-safe имя категории. */
  slug: string
  /** Число продуктов в категории. */
  productCount: number
}
