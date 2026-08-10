import type { ComponentPropsWithoutRef } from 'react'

/** Собственные параметры OrderHistory. */
export type OrderHistoryParams = object

/** Атрибуты корневой section без children. */
type RootAttrs = Omit<ComponentPropsWithoutRef<'section'>, 'children'>

/** Props истории доступных заказов. */
export type OrderHistoryProps = RootAttrs & OrderHistoryParams
