import type { ComponentPropsWithoutRef } from 'react'

import type { Product } from '@/domains/catalog'

/**
 * Собственные параметры product card внутри catalog screen.
 */
export type ProductCardParams = {
  /** Catalog-модель продукта. */
  product: Product
  /** Позиция карточки для editorial numbering. */
  index: number
}

/**
 * Атрибуты корневой article-карточки без внешнего содержимого.
 */
type RootAttrs = Omit<ComponentPropsWithoutRef<'article'>, 'children'>

/**
 * Props product card внутри catalog screen.
 */
export type ProductCardProps = RootAttrs & ProductCardParams
