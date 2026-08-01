import type { {{name.pascalCase}}ErrorCode } from '../types/{{name.kebabCase}}-error-code.type'

/**
 * Доменная ошибка бизнес-модуля {{name.pascalCase}}.
 *
 * UI/i18n-слой должен использовать `code`, а не `message`, для выбора пользовательского текста.
 */
export class {{name.pascalCase}}BusinessError extends Error {
  /** Код доменной ошибки для UI/i18n-слоя. */
  readonly code: {{name.pascalCase}}ErrorCode
  /** Исходная ошибка нижележащей runtime-зависимости. */
  readonly cause: unknown

  constructor(code: {{name.pascalCase}}ErrorCode, cause: unknown) {
    super(code)

    this.name = '{{name.pascalCase}}BusinessError'
    this.code = code
    this.cause = cause
  }
}
