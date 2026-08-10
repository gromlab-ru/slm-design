import type { JwtTokensDto } from '../generated'

const REFRESH_TOKEN_STORAGE_KEY = 'slm-store.refresh-token'

let accessToken: string | null = null

/**
 * Возвращает sessionStorage только в browser runtime.
 */
const getSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage
}

/**
 * Сохраняет новую пару JWT после входа или ротации refresh token.
 */
export const setSimpleRestApiTokens = (tokens: JwtTokensDto): void => {
  accessToken = tokens.accessToken
  getSessionStorage()?.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken)
}

/**
 * Возвращает access token текущей browser-сессии.
 */
export const getSimpleRestApiAccessToken = (): string | null => {
  return accessToken
}

/**
 * Возвращает refresh token, переживающий перезагрузку текущей вкладки.
 */
export const getSimpleRestApiRefreshToken = (): string | null => {
  return getSessionStorage()?.getItem(REFRESH_TOKEN_STORAGE_KEY) ?? null
}

/**
 * Проверяет, можно ли восстановить пользовательскую сессию.
 */
export const hasSimpleRestApiRefreshToken = (): boolean => {
  return getSimpleRestApiRefreshToken() !== null
}

/**
 * Удаляет transport credentials при выходе или истечении сессии.
 */
export const clearSimpleRestApiTokens = (): void => {
  accessToken = null
  getSessionStorage()?.removeItem(REFRESH_TOKEN_STORAGE_KEY)
}
