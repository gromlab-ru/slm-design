import { z } from 'zod'

import {
  clearSimpleRestApiTokens,
  getSimpleRestApiRefreshToken,
  hasSimpleRestApiRefreshToken,
  setSimpleRestApiTokens,
  simpleRestApi,
  toSimpleRestApiError
} from 'infra/simple-rest-api'
import type { SessionCredentials } from '../types/session-credentials.type'
import type { SessionUser } from '../types/session-user.type'
import { SessionError } from '../errors/session.error'

const sessionUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  role: z.enum(['admin', 'customer']),
  avatarUrl: z.url().nullable()
})

const authResponseSchema = z.object({
  data: z.object({
    tokens: z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      expiresIn: z.number(),
      tokenType: z.literal('Bearer')
    }),
    user: sessionUserSchema
  })
})

const userResponseSchema = z.object({ data: sessionUserSchema })

/**
 * Преобразует source failure в ожидаемый исход домена сессии.
 */
const mapSessionError = (error: unknown): SessionError => {
  const apiError = toSimpleRestApiError(error)

  if (apiError.code === 'INVALID_CREDENTIALS') {
    return new SessionError('invalid-credentials', 'Неверная почта или пароль.')
  }

  if (apiError.status === 429) {
    return new SessionError('rate-limited', 'Слишком много попыток. Повторите через несколько секунд.')
  }

  if (apiError.status === 401) {
    return new SessionError('expired', 'Сессия истекла. Войдите снова.')
  }

  return new SessionError('unavailable', 'Simple API недоступен. Проверьте, запущен ли demo-backend.')
}

/**
 * Открывает сессию по demo-credentials и сохраняет transport tokens.
 */
export const loginSession = async (credentials: SessionCredentials): Promise<SessionUser> => {
  try {
    const response = await simpleRestApi.auth.simpleAuthLogin(credentials)
    const parsedResponse = authResponseSchema.parse(response)

    setSimpleRestApiTokens(parsedResponse.data.tokens)

    return parsedResponse.data.user
  } catch (error) {
    throw mapSessionError(error)
  }
}

/**
 * Восстанавливает пользователя через сохранённый refresh token.
 */
export const restoreSession = async (): Promise<SessionUser | null> => {
  if (!hasSimpleRestApiRefreshToken()) {
    return null
  }

  try {
    const response = await simpleRestApi.users.simpleUsersMe()
    return userResponseSchema.parse(response).data
  } catch (error) {
    clearSimpleRestApiTokens()
    throw mapSessionError(error)
  }
}

/**
 * Отзывает refresh token и всегда очищает локальные credentials.
 */
export const logoutSession = async (): Promise<void> => {
  const refreshToken = getSimpleRestApiRefreshToken()

  try {
    if (refreshToken) {
      await simpleRestApi.auth.simpleAuthLogout({ refreshToken })
    }
  } finally {
    clearSimpleRestApiTokens()
  }
}
