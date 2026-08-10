import type { ComponentPropsWithoutRef } from 'react'

/**
 * Собственные параметры экрана SignIn.
 */
export type SignInScreenParams = object

/** Атрибуты корневого main без children. */
type RootAttrs = Omit<ComponentPropsWithoutRef<'main'>, 'children'>

/** Props публичного экрана входа. */
export type SignInScreenProps = RootAttrs & SignInScreenParams
