import type { ComponentPropsWithoutRef } from 'react'

/** Собственные параметры SessionBadge. */
export type SessionBadgeParams = object

/** Атрибуты корневого div без children. */
type RootAttrs = Omit<ComponentPropsWithoutRef<'div'>, 'children'>

/** Props краткого представления текущей сессии. */
export type SessionBadgeProps = RootAttrs & SessionBadgeParams
