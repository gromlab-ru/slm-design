import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры layout {{name.pascalCase}}.
 */
export type {{name.pascalCase}}LayoutParams = object

/** Атрибуты корневого элемента. */
type RootAttrs = ComponentPropsWithoutRef<'div'>

export type {{name.pascalCase}}LayoutProps = RootAttrs & {{name.pascalCase}}LayoutParams
