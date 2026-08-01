import type { RequestParams } from './generated'

const EXPECTED_SESSION_HEADER = 'X-Demo-Expected-Session'

/**
 * Technical failure raised before a protected request can cross session scopes.
 */
export class SimpleAuthSessionChangedError extends Error {
  public constructor() {
    super('The active auth session changed before the request was sent.')
    this.name = 'SimpleAuthSessionChangedError'
  }
}

/**
 * Создаёт request params, привязывающие protected mutation к logical session.
 */
export const createSimpleAuthSessionRequest = (sessionId: string): RequestParams => {
  return {
    headers: {
      [EXPECTED_SESSION_HEADER]: sessionId
    }
  }
}

/**
 * Извлекает client-only session precondition перед отправкой HTTP-запроса.
 */
export const takeExpectedSimpleAuthSession = (headers: Headers): string | null => {
  const expectedSessionId = headers.get(EXPECTED_SESSION_HEADER)

  headers.delete(EXPECTED_SESSION_HEADER)

  return expectedSessionId
}
