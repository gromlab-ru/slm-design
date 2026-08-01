'use client'

import { createContext } from 'react'
import type { {{name.pascalCase}}Business } from '../types/{{name.kebabCase}}-business.type'
import type { {{name.pascalCase}}BusinessProviderProps } from '../types/{{name.kebabCase}}-business-provider-props.type'

/**
 * Context business API для композиционного модуля {{name.pascalCase}}.
 */
export const {{name.pascalCase}}BusinessContext = createContext<{{name.pascalCase}}Business | null>(null)

/**
 * Провайдер business API для композиционного модуля {{name.pascalCase}}.
 *
 * Используется для:
 *  - передачи собранных business-фабрик вложенным модулям
 *  - сохранения единой client boundary для business API
 */
export const {{name.pascalCase}}BusinessProvider = (props: {{name.pascalCase}}BusinessProviderProps) => {
  const { children, value } = props

  return (
    <{{name.pascalCase}}BusinessContext.Provider value={value}>
      {children}
    </{{name.pascalCase}}BusinessContext.Provider>
  )
}
