import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры product detail screen.
 */
export type ProductDetailScreenParams = {
  /** Product id, адаптированный route entry. */
  productId: string
}

/**
 * Атрибуты корневого main без внешнего содержимого.
 */
type RootAttrs = Omit<ComponentPropsWithoutRef<'main'>, 'children'>

/**
 * Props product detail screen.
 */
export type ProductDetailScreenProps = RootAttrs & ProductDetailScreenParams
