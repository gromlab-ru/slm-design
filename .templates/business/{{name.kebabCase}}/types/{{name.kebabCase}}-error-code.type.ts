/**
 * Коды доменных ошибок бизнес-модуля {{name.pascalCase}}.
 */
export const {{name.screamingSnakeCase}}_ERROR_CODES = {
  /** Базовая доменная ошибка бизнес-модуля {{name.pascalCase}}. */
  UNKNOWN: '{{name.screamingSnakeCase}}_UNKNOWN'
} as const

/**
 * Код доменной ошибки бизнес-модуля {{name.pascalCase}}.
 */
export type {{name.pascalCase}}ErrorCode = (typeof {{name.screamingSnakeCase}}_ERROR_CODES)[keyof typeof {{name.screamingSnakeCase}}_ERROR_CODES]
