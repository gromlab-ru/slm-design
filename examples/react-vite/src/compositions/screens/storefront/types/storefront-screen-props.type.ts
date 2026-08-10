import type { ComponentPropsWithoutRef } from 'react'

/**
 * Собственные параметры экрана Storefront.
 */
export type StorefrontScreenParams = object

/** Атрибуты корневого main без children. */
type RootAttrs = Omit<ComponentPropsWithoutRef<'main'>, 'children'>

/** Props авторизованного storefront screen. */
export type StorefrontScreenProps = RootAttrs & StorefrontScreenParams
