import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры protected orders screen.
 */
export type OrdersScreenParams = object

/**
 * Атрибуты корневого main без внешнего содержимого.
 */
type RootAttrs = Omit<ComponentPropsWithoutRef<'main'>, 'children'>

/**
 * Props protected orders screen.
 */
export type OrdersScreenProps = RootAttrs & OrdersScreenParams
