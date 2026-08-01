import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры product administration screen.
 */
export type ProductAdminScreenParams = object

/**
 * Атрибуты корневого main без внешнего содержимого.
 */
type RootAttrs = Omit<ComponentPropsWithoutRef<'main'>, 'children'>

/**
 * Props product administration screen.
 */
export type ProductAdminScreenProps = RootAttrs & ProductAdminScreenParams
