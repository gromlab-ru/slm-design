import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры общего storefront layout.
 */
export type StoreShellLayoutParams = object

/**
 * Атрибуты корневого контейнера.
 */
type RootAttrs = ComponentPropsWithoutRef<'div'>

/**
 * Props общего storefront layout.
 */
export type StoreShellLayoutProps = RootAttrs & StoreShellLayoutParams
