import type { SimpleUserDto } from '@/infra/simple-rest-api'

import type { AuthUser } from '../types/auth-user.type'

/**
 * Переводит внешний user DTO в модель auth-домена.
 */
export const mapAuthUser = (user: SimpleUserDto): AuthUser => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : null
  }
}
