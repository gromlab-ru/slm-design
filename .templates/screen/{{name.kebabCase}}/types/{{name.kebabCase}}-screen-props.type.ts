import type { ComponentPropsWithoutRef } from 'react'

/**
 * Параметры экрана {{name.pascalCase}}.
 */
export type {{name.pascalCase}}ScreenParams = object

/** Атрибуты корневого элемента. */
type RootAttrs = ComponentPropsWithoutRef<'main'>

export type {{name.pascalCase}}ScreenProps = RootAttrs & {{name.pascalCase}}ScreenParams
