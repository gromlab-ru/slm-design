import type { ComponentPropsWithoutRef } from 'react'

/** Собственные параметры CartPanel. */
export type CartPanelParams = object

/** Атрибуты корневого aside без children. */
type RootAttrs = Omit<ComponentPropsWithoutRef<'aside'>, 'children'>

/** Props панели draft order. */
export type CartPanelProps = RootAttrs & CartPanelParams
