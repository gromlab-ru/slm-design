/** Роль пользователя в Simple Store. */
export type SessionRole = 'admin' | 'customer'

/**
 * Пользователь, с которым связана текущая browser-сессия.
 */
export type SessionUser = {
  /** Стабильный идентификатор пользователя. */
  id: string
  /** Email для входа и отображения. */
  email: string
  /** Отображаемое имя. */
  name: string
  /** Роль, определяющая доступные продуктовые действия. */
  role: SessionRole
  /** URL аватара или null для текстового fallback. */
  avatarUrl: string | null
}
