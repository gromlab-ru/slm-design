/**
 * Значение query-параметра, поддерживаемое REST-ключами.
 */
type QueryValue = boolean | number | string | null | undefined

/**
 * Собирает query string, пропуская отсутствующие значения.
 */
export const createQueryString = (query: Record<string, QueryValue>): string => {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const search = searchParams.toString()

  return search ? `?${search}` : ''
}
