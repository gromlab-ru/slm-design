/**
 * Нормализованная ошибка Simple API для source adapters.
 */
export class SimpleRestApiError extends Error {
  /** HTTP-статус ответа, если сервер успел его вернуть. */
  readonly status: number | null
  /** Стабильный код ошибки внешнего API. */
  readonly code: string
  /** Идентификатор запроса для диагностики backend-логов. */
  readonly requestId: string | null

  constructor(params: {
    /** HTTP-статус ответа, если сервер успел его вернуть. */
    status: number | null
    /** Стабильный код ошибки внешнего API. */
    code: string
    /** Безопасное публичное сообщение backend. */
    message: string
    /** Идентификатор запроса для диагностики backend-логов. */
    requestId: string | null
  }) {
    super(params.message)
    this.name = 'SimpleRestApiError'
    this.status = params.status
    this.code = params.code
    this.requestId = params.requestId
  }
}
