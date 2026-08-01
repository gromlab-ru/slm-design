import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры cart and checkout screen.
 */
export type CartScreenParams = object

/**
 * Атрибуты корневого main без внешнего содержимого.
 */
type RootAttrs = Omit<ComponentPropsWithoutRef<'main'>, 'children'>

/**
 * Props cart and checkout screen.
 */
export type CartScreenProps = RootAttrs & CartScreenParams
