/**
 * Browser-visible адрес Simple API, фиксируемый Next.js во время build.
 */
export const SIMPLE_REST_API_BASE_URL = process.env.NEXT_PUBLIC_SIMPLE_API_URL ?? 'http://localhost:3001'

/**
 * Таймаут отделяет управляемый timeout-сценарий от обычного slow-сценария.
 */
export const SIMPLE_REST_API_TIMEOUT_MS = 5_000
