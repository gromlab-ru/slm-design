import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры виджета {{name.pascalCase}}.
 */
export type {{name.pascalCase}}WidgetParams = object

/**
 * Атрибуты корневого элемента виджета {{name.pascalCase}}.
 */
type RootAttrs = ComponentPropsWithoutRef<'div'>

/**
 * Props виджета {{name.pascalCase}}.
 */
export type {{name.pascalCase}}WidgetProps = RootAttrs & {{name.pascalCase}}WidgetParams
