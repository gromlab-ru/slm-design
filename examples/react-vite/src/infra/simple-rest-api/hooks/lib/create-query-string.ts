type QueryValue = boolean | number | string | null | undefined

/**
 * Собирает стабильную query-строку для SWR cache key.
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
