import type { {{name.pascalCase}}Api } from './{{name.kebabCase}}-api.type'
import type { {{name.pascalCase}}Deps } from './{{name.kebabCase}}-deps.type'

/**
 * Фабрика публичного API бизнес-модуля {{name.pascalCase}}.
 */
export type {{name.pascalCase}}Factory = (deps: {{name.pascalCase}}Deps) => {{name.pascalCase}}Api
