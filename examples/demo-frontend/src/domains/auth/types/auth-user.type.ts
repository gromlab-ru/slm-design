/**
 * Роль пользователя в Simple storefront.
 */
export type AuthUserRole = 'admin' | 'customer'

/**
 * Авторизованный пользователь без transport-полей.
 */
export type AuthUser = {
  /** Стабильный идентификатор пользователя. */
  id: string
  /** Email для входа и отображения профиля. */
  email: string
  /** Отображаемое имя. */
  name: string
  /** Текущая роль доступа. */
  role: AuthUserRole
  /** Необязательный URL аватара. */
  avatarUrl: string | null
}
