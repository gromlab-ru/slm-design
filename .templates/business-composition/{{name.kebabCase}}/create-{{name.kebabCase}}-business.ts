import { {{name.camelCase}}Factory } from '../../../business/{{name.kebabCase}}'
import type { {{name.pascalCase}}Api } from '../../../business/{{name.kebabCase}}'

/**
 * Создаёт {{name.pascalCase}} business API с runtime-зависимостями приложения.
 */
export const create{{name.pascalCase}}Business = (): {{name.pascalCase}}Api => {
  return {{name.camelCase}}Factory({})
}
