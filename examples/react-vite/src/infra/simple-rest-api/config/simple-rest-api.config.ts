/** Базовый URL локального Simple API. */
export const SIMPLE_REST_API_BASE_URL =
  import.meta.env.VITE_SIMPLE_API_URL ?? 'http://localhost:3001'

/** Максимальное время выполнения одного REST-запроса. */
export const SIMPLE_REST_API_TIMEOUT_MS = 12_000
