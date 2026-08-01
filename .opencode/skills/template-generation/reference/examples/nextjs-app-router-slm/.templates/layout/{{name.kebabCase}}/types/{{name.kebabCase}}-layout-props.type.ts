import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры layout {{name.pascalCase}}.
 */
export type {{name.pascalCase}}LayoutParams = object

/**
 * Атрибуты корневого элемента layout {{name.pascalCase}}.
 */
type RootAttrs = ComponentPropsWithoutRef<'div'>

/**
 * Props layout {{name.pascalCase}}.
 */
export type {{name.pascalCase}}LayoutProps = RootAttrs & {{name.pascalCase}}LayoutParams
