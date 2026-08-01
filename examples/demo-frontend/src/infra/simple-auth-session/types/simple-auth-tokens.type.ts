/**
 * Технические JWT-данные текущей browser-сессии.
 */
export type SimpleAuthTokens = {
  /** Короткоживущий токен защищённых запросов. */
  accessToken: string
  /** Ротируемый токен обновления сессии. */
  refreshToken: string
  /** Срок действия access-токена в секундах. */
  expiresIn: number
}

/**
 * Идентификаторы одной логической сессии и текущей JWT-ротации.
 */
export type SimpleAuthSessionIdentity = {
  /** Стабильная область жизни от login до logout. */
  sessionId: string
  /** Меняется при каждой успешной JWT-ротации. */
  revision: string
}

/**
 * Persisted technical state одной browser-сессии.
 */
export type SimpleAuthSession = SimpleAuthSessionIdentity & {
  /** Текущая JWT-пара. */
  tokens: SimpleAuthTokens
}

/**
 * Результат чтения persisted technical session.
 */
export type SimpleAuthSessionReadResult =
  | {
      /** Storage доступен и session проверена. */
      status: 'ready'
      /** Активная session либо null для подтверждённого отсутствия. */
      session: SimpleAuthSession | null
    }
  | {
      /** Storage или persisted payload временно недоступны. */
      status: 'unavailable'
      /** Raw payload для CAS-recovery либо null при I/O failure. */
      observedValue: string | null
    }

/**
 * Подписчик на изменение technical auth state.
 */
export type SimpleAuthSessionListener = (result: SimpleAuthSessionReadResult) => void
