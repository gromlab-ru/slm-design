import type { ComponentPropsWithoutRef } from 'react'

/**
 * Собственные параметры AppShellLayout.
 */
export type AppShellLayoutParams = object

/** Атрибуты корневого div. */
type RootAttrs = ComponentPropsWithoutRef<'div'>

/** Props общего каркаса авторизованного приложения. */
export type AppShellLayoutProps = RootAttrs & AppShellLayoutParams
