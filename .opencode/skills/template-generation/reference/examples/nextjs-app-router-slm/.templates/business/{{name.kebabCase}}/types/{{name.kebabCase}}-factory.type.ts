import type { {{name.pascalCase}}Api } from './{{name.kebabCase}}-api.type'

/**
 * Фабрика публичного API бизнес-модуля {{name.pascalCase}}.
 */
export type {{name.pascalCase}}Factory = () => {{name.pascalCase}}Api
