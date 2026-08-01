import type { {{name.pascalCase}}ErrorCode } from './{{name.kebabCase}}-error-code.type'

/**
 * Публичный структурный контракт доменной ошибки {{name.pascalCase}}.
 */
export type {{name.pascalCase}}Error = {
  /** Исходная ошибка нижележащей runtime-зависимости. */
  cause: unknown
  /** Код доменной ошибки для UI/i18n-слоя. */
  code: {{name.pascalCase}}ErrorCode
  /** Сообщение ошибки, не используемое как UI-контракт. */
  message: string
  /** Имя доменной ошибки для диагностики. */
  name: string
}
