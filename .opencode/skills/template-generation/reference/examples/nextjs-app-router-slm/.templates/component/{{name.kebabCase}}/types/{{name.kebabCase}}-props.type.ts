import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры {{name.pascalCase}}.
 */
export type {{name.pascalCase}}Params = object

/**
 * Атрибуты корневого элемента {{name.pascalCase}}.
 */
type RootAttrs = ComponentPropsWithoutRef<'div'>

/**
 * Props компонента {{name.pascalCase}}.
 */
export type {{name.pascalCase}}Props = RootAttrs & {{name.pascalCase}}Params
