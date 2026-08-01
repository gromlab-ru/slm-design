import type { ReactNode } from 'react'
import type { {{name.pascalCase}}Business } from './{{name.kebabCase}}-business.type'

/**
 * Параметры провайдера business API для {{name.pascalCase}}.
 */
export type {{name.pascalCase}}BusinessProviderProps = {
  /** Вложенное дерево композиционного модуля. */
  children: ReactNode
  /** Собранный business API. */
  value: {{name.pascalCase}}Business
}
