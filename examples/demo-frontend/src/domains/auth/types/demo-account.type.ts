import type { AuthUserRole } from './auth-user.type'

/**
 * Детерминированная учётная запись fixture-бэкенда.
 */
export type DemoAccount = {
  /** Email для формы входа. */
  email: string
  /** Общий fixture-пароль. */
  password: string
  /** Роль, которую демонстрирует учётная запись. */
  role: AuthUserRole
  /** Краткое описание доступных сценариев. */
  description: string
}
