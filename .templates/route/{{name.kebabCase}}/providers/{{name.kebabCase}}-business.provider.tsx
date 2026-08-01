import { BusinessProvider } from '@/infra/business'
import type { {{name.pascalCase}}BusinessProviderProps } from '../types/{{name.kebabCase}}-business-provider-props.type'

/**
 * Route-level provider бизнес-модулей для {{name.pascalCase}} route.
 *
 * Используется для:
 *  - владения business API в lifecycle route-ветки
 */
export const {{name.pascalCase}}BusinessProvider = (props: {{name.pascalCase}}BusinessProviderProps) => {
  const { children } = props

  return (
    <BusinessProvider value={{}}>
      {children}
    </BusinessProvider>
  )
}
