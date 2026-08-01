import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры виджета {{name.pascalCase}}.
 */
export type {{name.pascalCase}}WidgetParams = object

/** Атрибуты корневого элемента. */
type RootAttrs = ComponentPropsWithoutRef<'div'>

export type {{name.pascalCase}}WidgetProps = RootAttrs & {{name.pascalCase}}WidgetParams
