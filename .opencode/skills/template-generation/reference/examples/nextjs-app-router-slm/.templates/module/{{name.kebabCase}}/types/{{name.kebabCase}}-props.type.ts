import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры модуля {{name.pascalCase}}.
 */
export type {{name.pascalCase}}Params = object

/**
 * Атрибуты корневого элемента модуля {{name.pascalCase}}.
 */
type RootAttrs = ComponentPropsWithoutRef<'div'>

/**
 * Props модуля {{name.pascalCase}}.
 */
export type {{name.pascalCase}}Props = RootAttrs & {{name.pascalCase}}Params
