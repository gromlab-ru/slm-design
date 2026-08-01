'use client'

import { useContext } from 'react'
import { {{name.pascalCase}}BusinessContext } from '../providers/{{name.kebabCase}}-business.provider'
import type { {{name.pascalCase}}Business } from '../types/{{name.kebabCase}}-business.type'

/**
 * Возвращает business API, доступный внутри композиционного модуля {{name.pascalCase}}.
 */
export const use{{name.pascalCase}}Business = (): {{name.pascalCase}}Business => {
  const business = useContext({{name.pascalCase}}BusinessContext)

  if (!business) {
    throw new Error('use{{name.pascalCase}}Business must be used within {{name.pascalCase}}BusinessProvider')
  }

  return business
}
