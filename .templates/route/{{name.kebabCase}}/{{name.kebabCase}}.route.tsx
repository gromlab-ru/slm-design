import { {{name.pascalCase}}Screen } from '@/compositions/screens/{{name.kebabCase}}'
import { {{name.pascalCase}}BusinessProvider } from './providers/{{name.kebabCase}}-business.provider'

/**
 * Route module страницы {{name.pascalCase}}.
 *
 * Используется для:
 *  - сборки route-level business graph и screen страницы
 */
export const {{name.pascalCase}}Route = () => {
  return (
    <{{name.pascalCase}}BusinessProvider>
      <{{name.pascalCase}}Screen />
    </{{name.pascalCase}}BusinessProvider>
  )
}
