import type { Result } from '@/shared/types/result.type'

import type { AuthError } from './auth-error.type'
import type { AuthUser } from './auth-user.type'

/**
 * Состояние восстановления пользовательской сессии.
 */
export type AuthStatus = 'checking' | 'guest' | 'authenticated' | 'unavailable'

/**
 * Данные формы входа.
 */
export type SignInCredentials = {
  /** Email demo-пользователя. */
  email: string
  /** Пароль demo-пользователя. */
  password: string
}

/**
 * Публичный API auth-домена в application scope.
 */
export type AuthContextValue = {
  /** Текущее состояние восстановления или авторизации. */
  status: AuthStatus
  /** Авторизованный пользователь, если сессия активна. */
  user: AuthUser | null
  /** Непрозрачный ключ логической сессии для изоляции protected state. */
  sessionKey: string | null
  /** Recoverable ошибка проверки сохранённой сессии. */
  sessionError: AuthError | null
  /** Проверяет актуальность captured logical session для async workflow. */
  isCurrentSession: (sessionKey: string) => boolean
  /** Выполняет login и сохраняет технические JWT-данные. */
  signIn: (credentials: SignInCredentials) => Promise<Result<AuthUser, AuthError>>
  /** Завершает локальную и backend-сессию. */
  signOut: () => Promise<void>
  /** Повторно загружает профиль после внешнего изменения роли. */
  refreshCurrentUser: () => Promise<Result<AuthUser, AuthError>>
}
