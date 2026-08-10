/** Валюта продукта в Simple Store. */
export type CatalogCurrency = 'USD' | 'EUR'

/**
 * Продукт каталога с данными, необходимыми для покупки и управления.
 */
export type CatalogProduct = {
  /** Стабильный идентификатор продукта. */
  id: string
  /** Отображаемое название. */
  name: string
  /** URL-safe имя продукта. */
  slug: string
  /** Пользовательское описание. */
  description: string
  /** Цена в минимальных единицах валюты. */
  priceCents: number
  /** Валюта цены. */
  currency: CatalogCurrency
  /** Идентификатор категории. */
  categoryId: string
  /** Доступный остаток. */
  stock: number
  /** Средняя оценка от нуля до пяти. */
  rating: number
  /** URL изображения продукта. */
  imageUrl: string
  /** ISO-дата создания. */
  createdAt: string
  /** Версия для optimistic locking. */
  version: number
}

/**
 * Данные администратора для создания продукта.
 */
export type CreateCatalogProduct = {
  /** Название длиной от двух символов. */
  name: string
  /** Описание длиной от десяти символов. */
  description: string
  /** Цена в минимальных единицах валюты. */
  priceCents: number
  /** Валюта цены. */
  currency: CatalogCurrency
  /** Идентификатор существующей категории. */
  categoryId: string
  /** Начальный доступный остаток. */
  stock: number
  /** HTTPS URL изображения на picsum.photos. */
  imageUrl: string
}

/**
 * Изменяемые данные продукта вместе с прочитанной версией.
 */
export type UpdateCatalogProduct = CreateCatalogProduct & {
  /** Версия, прочитанная перед редактированием. */
  version: number
}
