import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры экрана {{name.pascalCase}}.
 */
export type {{name.pascalCase}}ScreenParams = object

/**
 * Атрибуты корневого элемента экрана {{name.pascalCase}}.
 */
type RootAttrs = ComponentPropsWithoutRef<'main'>

/**
 * Props экрана {{name.pascalCase}}.
 */
export type {{name.pascalCase}}ScreenProps = RootAttrs & {{name.pascalCase}}ScreenParams
