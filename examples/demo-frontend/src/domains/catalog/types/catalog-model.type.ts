/**
 * Валюта витрины, поддерживаемая Simple API.
 */
export type CatalogCurrency = 'USD' | 'EUR'

/**
 * Продукт каталога с optimistic-lock версией.
 */
export type Product = {
  /** Стабильный идентификатор. */
  id: string
  /** Название продукта. */
  name: string
  /** URL-friendly имя. */
  slug: string
  /** Описание для карточки и detail-экрана. */
  description: string
  /** Цена в минимальных единицах валюты. */
  priceCents: number
  /** Валюта цены. */
  currency: CatalogCurrency
  /** Идентификатор категории. */
  categoryId: string
  /** Доступный остаток. */
  stock: number
  /** Рейтинг от нуля до пяти. */
  rating: number
  /** URL изображения продукта. */
  imageUrl: string
  /** ISO-дата создания. */
  createdAt: string
  /** Версия последнего прочитанного состояния. */
  version: number
}

/**
 * Категория выдачи продуктов.
 */
export type Category = {
  /** Стабильный идентификатор. */
  id: string
  /** Отображаемое название. */
  name: string
  /** URL-friendly имя. */
  slug: string
  /** Число продуктов в текущем backend seed. */
  productCount: number
}

/**
 * Метаданные offset pagination.
 */
export type CatalogPagination = {
  /** Текущая страница. */
  page: number
  /** Размер страницы. */
  limit: number
  /** Полное число совпадений. */
  total: number
  /** Полное число страниц. */
  totalPages: number
}
