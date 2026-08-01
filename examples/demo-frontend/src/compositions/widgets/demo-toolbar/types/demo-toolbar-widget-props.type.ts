import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры виджета архитектурных demo-сценариев.
 */
export type DemoToolbarWidgetParams = object

/**
 * Атрибуты корневого aside.
 */
type RootAttrs = ComponentPropsWithoutRef<'aside'>

/**
 * Props demo toolbar widget.
 */
export type DemoToolbarWidgetProps = RootAttrs & DemoToolbarWidgetParams
