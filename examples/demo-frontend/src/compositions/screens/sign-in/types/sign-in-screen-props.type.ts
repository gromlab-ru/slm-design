import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры sign-in screen.
 */
export type SignInScreenParams = object

/**
 * Атрибуты корневого main без внешнего содержимого.
 */
type RootAttrs = Omit<ComponentPropsWithoutRef<'main'>, 'children'>

/**
 * Props sign-in screen.
 */
export type SignInScreenProps = RootAttrs & SignInScreenParams
