import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры модуля {{name.pascalCase}}.
 */
export type {{name.pascalCase}}Params = object

/** Атрибуты корневого элемента. */
type RootAttrs = ComponentPropsWithoutRef<'div'>

export type {{name.pascalCase}}Props = RootAttrs & {{name.pascalCase}}Params
