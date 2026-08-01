import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры storefront catalog screen.
 */
export type CatalogScreenParams = object

/**
 * Атрибуты корневого main без внешнего содержимого.
 */
type RootAttrs = Omit<ComponentPropsWithoutRef<'main'>, 'children'>

/**
 * Props storefront catalog screen.
 */
export type CatalogScreenProps = RootAttrs & CatalogScreenParams
