import { z } from 'zod'

import { ApiError } from '../generated'
import { SimpleRestApiError } from './simple-rest-api.error'

const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string().optional()
})

/**
 * Преобразует transport failure в стабильную ошибку REST-модуля.
 */
export const toSimpleRestApiError = (error: unknown): SimpleRestApiError => {
  if (error instanceof SimpleRestApiError) {
    return error
  }

  if (error instanceof ApiError) {
    const parsedError = errorResponseSchema.safeParse(error.error)

    if (parsedError.success) {
      return new SimpleRestApiError({
        status: error.status,
        code: parsedError.data.code,
        message: parsedError.data.message,
        requestId: parsedError.data.requestId ?? null
      })
    }

    return new SimpleRestApiError({
      status: error.status,
      code: `HTTP_${error.status}`,
      message: error.message,
      requestId: null
    })
  }

  if (error instanceof Error) {
    return new SimpleRestApiError({
      status: null,
      code: 'NETWORK_ERROR',
      message: error.message,
      requestId: null
    })
  }

  return new SimpleRestApiError({
    status: null,
    code: 'UNKNOWN_ERROR',
    message: 'Не удалось выполнить запрос к Simple API.',
    requestId: null
  })
}
